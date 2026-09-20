# conftest.py — pytest configuration for the backend package
#
# Problem this solves:
# When running `pytest` from backend/, test files import modules as e.g.
# `from dispatch.adapters import ...` — this requires `backend/` to be on
# sys.path. Python's pytest rootdir detection doesn't add it automatically
# unless a conftest.py is present at the root of the test tree.
#
# By placing this file in backend/, pytest adds backend/ to sys.path,
# so all absolute package imports (dispatch.*, forecasting.*) resolve
# correctly without any sys.path manipulation inside test files.
