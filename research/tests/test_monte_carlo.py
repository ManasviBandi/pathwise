from pathwise_research.monte_carlo import GBMParams, gbm_paths, summarize_paths
from pathwise_research.option_pricing import black_scholes_price, monte_carlo_option_price, OptionParams


def test_gbm_reproducible():
    p = GBMParams(n_paths=2000, n_steps=50, seed=7)
    a = gbm_paths(p)["terminal"].mean()
    b = gbm_paths(p)["terminal"].mean()
    assert a == b


def test_bs_call_positive():
    out = black_scholes_price(200, 210, 0.5, 0.04, 0.25, "call")
    assert out["price"] > 0


def test_mc_near_bs():
    params = OptionParams(n_paths=80_000, seed=1)
    out = monte_carlo_option_price(params)
    assert abs(out["difference"]) < 0.5


def test_summarize_keys():
    p = GBMParams(n_paths=500, n_steps=20, seed=0)
    sim = gbm_paths(p)
    s = summarize_paths(sim["terminal"], sim["paths"], sim["t"], target_price=210)
    assert "expected_value" in s["stats"]
    assert "prob_exceed_target" in s["stats"]
    assert len(s["chart"]["mean"]) == 21
