from dispatch.objective import calculate_objective


def test_objective_default_weights():
    result = calculate_objective(
        cost=100,
        emissions=20,
    )

    assert result == 120
    print("Default objective test passed")


def test_objective_custom_weights():
    result = calculate_objective(
        cost=100,
        emissions=20,
        w1=2,
        w2=3,
    )

    assert result == 260
    print("Custom objective test passed")


if __name__ == "__main__":
    test_objective_default_weights()
    test_objective_custom_weights()

    print("\nAll objective tests passed!")