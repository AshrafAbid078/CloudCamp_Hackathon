def calculate_objective(
    cost: float,
    emissions: float,
    w1: float = 1.0,
    w2: float = 1.0,
) -> float:
    """
    Calculate the combined optimization objective.

    Objective = w1 * cost + w2 * emissions
    """

    return (w1 * cost) + (w2 * emissions)