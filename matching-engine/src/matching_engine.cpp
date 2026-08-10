#include "pathwise/matching_engine.hpp"

#include <cmath>

namespace pathwise {

void MatchingEngine::seed_demo_book(double mid, std::uint32_t base_qty) {
  // Classic educational ladder around mid
  const double ask_offsets[] = {0.01, 0.02, 0.03};
  const double bid_offsets[] = {0.01, 0.02, 0.03};
  const std::uint32_t ask_qtys[] = {500, 250, 100};
  const std::uint32_t bid_qtys[] = {200, 350, 100};

  for (int i = 0; i < 3; ++i) {
    Order ask;
    ask.id = next_id();
    ask.side = Side::Ask;
    ask.type = OrderType::Limit;
    ask.price = mid + ask_offsets[i];
    ask.quantity = ask_qtys[i] * (base_qty / 100);
    ask.remaining = ask.quantity;
    ask.timestamp = ++time_counter_;
    book_.rest(ask);

    Order bid;
    bid.id = next_id();
    bid.side = Side::Bid;
    bid.type = OrderType::Limit;
    bid.price = mid - bid_offsets[i];
    bid.quantity = bid_qtys[i] * (base_qty / 100);
    bid.remaining = bid.quantity;
    bid.timestamp = ++time_counter_;
    book_.rest(bid);
  }
}

MatchResult MatchingEngine::submit(Side side, OrderType type, std::uint32_t quantity,
                                   double limit_price) {
  Order o;
  o.id = next_id();
  o.side = side;
  o.type = type;
  o.price = limit_price;
  o.quantity = quantity;
  o.remaining = quantity;
  o.timestamp = ++time_counter_;
  return book_.match(o);
}

bool MatchingEngine::cancel(std::uint64_t order_id) { return book_.cancel(order_id); }

BookSnapshot MatchingEngine::book(std::size_t depth) const { return book_.snapshot(depth); }

}  // namespace pathwise