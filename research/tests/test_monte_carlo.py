from pathwise_research.monte_carlo import GBMParams, gbm_paths, summarize_paths


def test_gbm_reproducible():
    p = GBMParams(n_paths=2000, n_steps=50, seed=7)
    a = gbm_paths(p)["terminal"].mean()
    b = gbm_paths(p)["terminal"].mean()
    assert a == b


def test_summarize_keys():
    p = GBMParams(n_paths=500, n_steps=20, seed=0)
    sim = gbm_paths(p)
    s = summarize_paths(sim["terminal"], sim["paths"], sim["t"], target_price=210)
    assert "expected_value" in s["stats"]
    assert "prob_exceed_target" in s["stats"]
    assert len(s["chart"]["mean"]) == 21
