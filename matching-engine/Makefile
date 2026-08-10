# Pathwise Matching Engine
#
# Price-time priority limit order book for educational simulation.

CXX      ?= g++
CXXFLAGS := -std=c++17 -O2 -Wall -Wextra -Wpedantic -Iinclude
LDFLAGS  :=

SRC_DIR  := src
TEST_DIR := tests
BENCH_DIR := benches
BUILD    := build

LIB_SRCS := $(SRC_DIR)/order_book.cpp $(SRC_DIR)/matching_engine.cpp
LIB_OBJS := $(patsubst $(SRC_DIR)/%.cpp,$(BUILD)/%.o,$(LIB_SRCS))

.PHONY: all clean test bench lib

all: lib $(BUILD)/pathwise_cli

lib: $(BUILD)/libpathwise_matching.a

$(BUILD):
	mkdir -p $(BUILD)

$(BUILD)/%.o: $(SRC_DIR)/%.cpp | $(BUILD)
	$(CXX) $(CXXFLAGS) -c $< -o $@

$(BUILD)/libpathwise_matching.a: $(LIB_OBJS)
	ar rcs $@ $^

$(BUILD)/pathwise_cli: $(SRC_DIR)/main.cpp $(BUILD)/libpathwise_matching.a
	$(CXX) $(CXXFLAGS) $< -L$(BUILD) -lpathwise_matching -o $@

$(BUILD)/test_order_book: $(TEST_DIR)/test_order_book.cpp $(BUILD)/libpathwise_matching.a
	$(CXX) $(CXXFLAGS) $< -L$(BUILD) -lpathwise_matching -o $@

$(BUILD)/bench_matching: $(BENCH_DIR)/bench_matching.cpp $(BUILD)/libpathwise_matching.a
	$(CXX) $(CXXFLAGS) $< -L$(BUILD) -lpathwise_matching -o $@

test: $(BUILD)/test_order_book
	./$(BUILD)/test_order_book

bench: $(BUILD)/bench_matching
	./$(BUILD)/bench_matching

clean:
	rm -rf $(BUILD)