#include "pathwise/matching_engine.hpp"

#include <chrono>
#include <iostream>

using namespace pathwise;
using clock_type = std::chrono::high_resolution_clock;

int main() {
  MatchingEngine eng;
  eng.seed_demo_book(100.0, 1000);

  constexpr int N = 50000;
  auto t0 = clock_type::now();
  for (int i = 0; i < N; ++i) {
    Side side = (i % 2 == 0) ? Side::Bid : Side::Ask;
    OrderType type = (i % 5 == 0) ? OrderType::Market : OrderType::Limit;
    double px = 100.0 + ((i % 7) - 3) * 0.01;
    eng.submit(side, type, 10, px);
    if (i % 100 == 0) {
      // replenish thin book occasionally
      eng.seed_demo_book(100.0, 100);
    }
  }
  auto t1 = clock_type::now();
  auto ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
  std::cout << "Processed " << N << " orders in " << ms << " ms ("
            << (N / (ms / 1000.0)) << " orders/sec)\n";
  return 0;
}