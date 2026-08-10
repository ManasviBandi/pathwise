#pragma once

#include <cstdint>
#include <optional>
#include <string>
#include <vector>

namespace pathwise {

enum class Side { Bid, Ask };
enum class OrderType { Market, Limit };
enum class OrderStatus { New, PartiallyFilled, Filled, Rejected, Cancelled };

struct Order {
  std::uint64_t id{0};
  Side side{Side::Bid};
  OrderType type{OrderType::Limit};
  double price{0.0};      // ignored for market orders
  std::uint32_t quantity{0};
  std::uint32_t remaining{0};
  OrderStatus status{OrderStatus::New};
  std::uint64_t timestamp{0};
};

struct Fill {
  std::uint64_t maker_id{0};
  std::uint64_t taker_id{0};
  double price{0.0};
  std::uint32_t quantity{0};
};

struct Level {
  double price{0.0};
  std::uint32_t quantity{0};
  std::size_t order_count{0};
};

struct BookSnapshot {
  std::vector<Level> bids;
  std::vector<Level> asks;
  std::optional<double> best_bid;
  std::optional<double> best_ask;
  std::optional<double> mid;
  std::optional<double> spread;
};

struct MatchResult {
  Order order;
  std::vector<Fill> fills;
  double avg_price{0.0};
  std::uint32_t filled_qty{0};
  std::string explanation;
};

}  // namespace pathwise