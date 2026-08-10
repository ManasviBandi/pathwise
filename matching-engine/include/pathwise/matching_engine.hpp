#pragma once

#include "pathwise/order_book.hpp"

#include <cstdint>

namespace pathwise {

/**
 * Thin façade over OrderBook: assigns ids/timestamps and seeds demo liquidity.
 */
class MatchingEngine {
 public:
  MatchingEngine() = default;

  void seed_demo_book(double mid = 201.42, std::uint32_t base_qty = 100);
  MatchResult submit(Side side, OrderType type, std::uint32_t quantity, double limit_price = 0.0);
  bool cancel(std::uint64_t order_id);
  BookSnapshot book(std::size_t depth = 10) const;

  std::uint64_t next_id() { return ++id_counter_; }

 private:
  OrderBook book_;
  std::uint64_t id_counter_{0};
  std::uint64_t time_counter_{0};
};

}  // namespace pathwise