#include "pathwise/matching_engine.hpp"

#include <iomanip>
#include <iostream>

using pathwise::MatchingEngine;
using pathwise::OrderType;
using pathwise::Side;

int main() {
  MatchingEngine engine;
  engine.seed_demo_book(201.42);

  auto snap = engine.book();
  std::cout << std::fixed << std::setprecision(2);
  std::cout << "ASK\n";
  for (auto it = snap.asks.rbegin(); it != snap.asks.rend(); ++it) {
    std::cout << "$" << it->price << "   " << it->quantity << "\n";
  }
  std::cout << "---\n";
  if (snap.mid) std::cout << "$" << *snap.mid << "\n";
  std::cout << "---\n";
  for (const auto& lvl : snap.bids) {
    std::cout << "$" << lvl.price << "   " << lvl.quantity << "\n";
  }
  std::cout << "BID\n\n";

  auto result = engine.submit(Side::Bid, OrderType::Market, 500);
  std::cout << result.explanation << "\n";
  return 0;
}