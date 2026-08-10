#pragma once

#include "pathwise/types.hpp"

#include <deque>
#include <map>
#include <unordered_map>
#include <vector>

namespace pathwise {

/**
 * Limit order book with price-time priority.
 * Bids sorted descending, asks ascending.
 */
class OrderBook {
 public:
  BookSnapshot snapshot(std::size_t depth = 10) const;

  /** Rest a limit order on the book (no matching). */
  void rest(const Order& order);

  /** Cancel resting order by id. Returns true if found. */
  bool cancel(std::uint64_t order_id);

  /**
   * Match an incoming (taker) order against the book.
   * Mutates the book for consumed liquidity.
   */
  MatchResult match(Order taker);

  bool empty() const;
  std::size_t order_count() const { return orders_.size(); }

 private:
  // price -> FIFO queue of order ids
  std::map<double, std::deque<std::uint64_t>, std::greater<double>> bids_;
  std::map<double, std::deque<std::uint64_t>, std::less<double>> asks_;
  std::unordered_map<std::uint64_t, Order> orders_;

  void remove_empty_levels();
  std::string build_explanation(const Order& taker, const std::vector<Fill>& fills,
                                double avg, std::uint32_t filled) const;
};

}  // namespace pathwise