#include "pathwise/order_book.hpp"

#include <algorithm>
#include <cmath>
#include <sstream>

namespace pathwise {

void OrderBook::rest(const Order& order) {
  Order stored = order;
  stored.remaining = order.quantity;
  stored.status = OrderStatus::New;
  orders_[stored.id] = stored;
  if (stored.side == Side::Bid) {
    bids_[stored.price].push_back(stored.id);
  } else {
    asks_[stored.price].push_back(stored.id);
  }
}

bool OrderBook::cancel(std::uint64_t order_id) {
  auto it = orders_.find(order_id);
  if (it == orders_.end()) return false;
  Order& o = it->second;
  if (o.side == Side::Bid) {
    auto lit = bids_.find(o.price);
    if (lit != bids_.end()) {
      auto& q = lit->second;
      q.erase(std::remove(q.begin(), q.end(), order_id), q.end());
      if (q.empty()) bids_.erase(lit);
    }
  } else {
    auto lit = asks_.find(o.price);
    if (lit != asks_.end()) {
      auto& q = lit->second;
      q.erase(std::remove(q.begin(), q.end(), order_id), q.end());
      if (q.empty()) asks_.erase(lit);
    }
  }
  orders_.erase(it);
  return true;
}

void OrderBook::remove_empty_levels() {
  for (auto it = bids_.begin(); it != bids_.end();) {
    if (it->second.empty()) it = bids_.erase(it);
    else ++it;
  }
  for (auto it = asks_.begin(); it != asks_.end();) {
    if (it->second.empty()) it = asks_.erase(it);
    else ++it;
  }
}

MatchResult OrderBook::match(Order taker) {
  MatchResult result;
  taker.remaining = taker.quantity;
  taker.status = OrderStatus::New;
  std::vector<Fill> fills;
  double notional = 0.0;
  std::uint32_t filled = 0;

  auto can_cross = [&](double book_price) -> bool {
    if (taker.type == OrderType::Market) return true;
    if (taker.side == Side::Bid) return book_price <= taker.price + 1e-12;
    return book_price + 1e-12 >= taker.price;
  };

  if (taker.side == Side::Bid) {
    while (taker.remaining > 0 && !asks_.empty()) {
      auto lit = asks_.begin();
      double px = lit->first;
      if (!can_cross(px)) break;
      auto& queue = lit->second;
      while (taker.remaining > 0 && !queue.empty()) {
        std::uint64_t maker_id = queue.front();
        Order& maker = orders_.at(maker_id);
        std::uint32_t qty = std::min(taker.remaining, maker.remaining);
        fills.push_back(Fill{maker_id, taker.id, px, qty});
        notional += px * qty;
        filled += qty;
        taker.remaining -= qty;
        maker.remaining -= qty;
        if (maker.remaining == 0) {
          maker.status = OrderStatus::Filled;
          queue.pop_front();
          orders_.erase(maker_id);
        } else {
          maker.status = OrderStatus::PartiallyFilled;
        }
      }
      if (queue.empty()) asks_.erase(lit);
    }
  } else {
    while (taker.remaining > 0 && !bids_.empty()) {
      auto lit = bids_.begin();
      double px = lit->first;
      if (!can_cross(px)) break;
      auto& queue = lit->second;
      while (taker.remaining > 0 && !queue.empty()) {
        std::uint64_t maker_id = queue.front();
        Order& maker = orders_.at(maker_id);
        std::uint32_t qty = std::min(taker.remaining, maker.remaining);
        fills.push_back(Fill{maker_id, taker.id, px, qty});
        notional += px * qty;
        filled += qty;
        taker.remaining -= qty;
        maker.remaining -= qty;
        if (maker.remaining == 0) {
          maker.status = OrderStatus::Filled;
          queue.pop_front();
          orders_.erase(maker_id);
        } else {
          maker.status = OrderStatus::PartiallyFilled;
        }
      }
      if (queue.empty()) bids_.erase(lit);
    }
  }

  if (filled == 0) {
    taker.status = (taker.type == OrderType::Market) ? OrderStatus::Rejected : OrderStatus::New;
  } else if (taker.remaining == 0) {
    taker.status = OrderStatus::Filled;
  } else {
    taker.status = OrderStatus::PartiallyFilled;
  }

  // Rest unfilled limit remainder
  if (taker.type == OrderType::Limit && taker.remaining > 0 &&
      taker.status != OrderStatus::Rejected) {
    Order resting = taker;
    resting.quantity = taker.remaining;
    resting.remaining = taker.remaining;
    rest(resting);
  }

  double avg = filled > 0 ? notional / static_cast<double>(filled) : 0.0;
  result.order = taker;
  result.fills = std::move(fills);
  result.avg_price = avg;
  result.filled_qty = filled;
  result.explanation = build_explanation(taker, result.fills, avg, filled);
  return result;
}

std::string OrderBook::build_explanation(const Order& taker, const std::vector<Fill>& fills,
                                         double avg, std::uint32_t filled) const {
  std::ostringstream oss;
  const char* side = taker.side == Side::Bid ? "buy" : "sell";
  const char* typ = taker.type == OrderType::Market ? "market" : "limit";

  if (filled == 0) {
    if (taker.type == OrderType::Market) {
      oss << "Your market order to " << side << " " << taker.quantity
          << " shares found no liquidity and was rejected.";
    } else {
      oss << "You submitted a limit " << side << " for " << taker.quantity
          << " @ $" << taker.price
          << ". It did not cross the book and rests as a working order.";
    }
    return oss.str();
  }

  std::size_t levels = 0;
  double last_px = -1.0;
  for (const auto& f : fills) {
    if (std::abs(f.price - last_px) > 1e-9) {
      ++levels;
      last_px = f.price;
    }
  }

  oss << "You submitted a " << typ << " order to " << side << " " << taker.quantity
      << " shares. The order consumed liquidity at " << levels << " price level"
      << (levels == 1 ? "" : "s") << ", filling " << filled
      << " shares at an average execution price of $" << avg << ".";

  if (taker.type == OrderType::Market && levels > 1) {
    oss << " Walking multiple levels is how market orders create slippage when liquidity is thin.";
  }
  if (taker.remaining > 0 && taker.type == OrderType::Limit) {
    oss << " The unfilled remainder (" << taker.remaining << ") rests on the book.";
  }
  return oss.str();
}

BookSnapshot OrderBook::snapshot(std::size_t depth) const {
  BookSnapshot snap;
  std::size_t n = 0;
  for (const auto& [px, q] : bids_) {
    if (n >= depth) break;
    std::uint32_t qty = 0;
    for (auto id : q) qty += orders_.at(id).remaining;
    snap.bids.push_back(Level{px, qty, q.size()});
    ++n;
  }
  n = 0;
  for (const auto& [px, q] : asks_) {
    if (n >= depth) break;
    std::uint32_t qty = 0;
    for (auto id : q) qty += orders_.at(id).remaining;
    snap.asks.push_back(Level{px, qty, q.size()});
    ++n;
  }
  if (!snap.bids.empty()) snap.best_bid = snap.bids.front().price;
  if (!snap.asks.empty()) snap.best_ask = snap.asks.front().price;
  if (snap.best_bid && snap.best_ask) {
    snap.mid = (*snap.best_bid + *snap.best_ask) / 2.0;
    snap.spread = *snap.best_ask - *snap.best_bid;
  }
  return snap;
}

bool OrderBook::empty() const { return orders_.empty(); }

}  // namespace pathwise