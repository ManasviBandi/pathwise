#include "pathwise/matching_engine.hpp"

#include <cmath>
#include <iostream>
#include <string>

using namespace pathwise;

static int failures = 0;

#define EXPECT_TRUE(cond)                                                                          \
  do {                                                                                             \
    if (!(cond)) {                                                                                 \
      std::cerr << "FAIL: " << #cond << " at " << __FILE__ << ":" << __LINE__ << "\n";           \
      ++failures;                                                                                  \
    }                                                                                              \
  } while (0)

#define EXPECT_NEAR(a, b, eps) EXPECT_TRUE(std::fabs((a) - (b)) < (eps))

void test_market_buy_walks_book() {
  MatchingEngine eng;
  eng.seed_demo_book(201.42);
  auto r = eng.submit(Side::Bid, OrderType::Market, 500);
  EXPECT_TRUE(r.filled_qty == 500);
  EXPECT_NEAR(r.avg_price, 201.43, 0.001);
  EXPECT_TRUE(r.fills.size() >= 1);
}

void test_limit_rests_when_not_crossing() {
  MatchingEngine eng;
  eng.seed_demo_book(201.42);
  auto before = eng.book().bids.size();
  auto r = eng.submit(Side::Bid, OrderType::Limit, 100, 201.40);
  EXPECT_TRUE(r.filled_qty == 0);
  EXPECT_TRUE(eng.book().bids.size() >= before);
}

void test_limit_buy_crosses() {
  MatchingEngine eng;
  eng.seed_demo_book(201.42);
  auto r = eng.submit(Side::Bid, OrderType::Limit, 100, 201.45);
  EXPECT_TRUE(r.filled_qty == 100);
  EXPECT_NEAR(r.avg_price, 201.43, 0.001);
}

void test_spread_present() {
  MatchingEngine eng;
  eng.seed_demo_book(201.42);
  auto snap = eng.book();
  EXPECT_TRUE(snap.spread.has_value());
  EXPECT_NEAR(*snap.spread, 0.02, 1e-9);
}

int main() {
  test_market_buy_walks_book();
  test_limit_rests_when_not_crossing();
  test_limit_buy_crosses();
  test_spread_present();

  if (failures == 0) {
    std::cout << "All matching-engine tests passed.\n";
    return 0;
  }
  std::cerr << failures << " test(s) failed.\n";
  return 1;
}