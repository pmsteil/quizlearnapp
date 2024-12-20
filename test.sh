# cd backend
# pipenv run python -m ai.test_plan_creator
# pipenv run python -m ai.test_lesson_evaluator
# pipenv run python -m ai.test_lesson_teacher
pipenv run python -m pytest backend/tests/ -v --capture=no
