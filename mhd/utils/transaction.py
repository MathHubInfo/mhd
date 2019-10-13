from django.db import transaction
import functools

def with_simulate_arg(original):
    """
        Wraps a function in a transaction and gives it an
        additional argument 'simulate' which rolls back the
        transaction when set to True.
    """
    @functools.wraps(original)
    def wrapper(*args, **kwargs):
        res = None
        try:
            simulate = kwargs.pop('simulate', False)
            with transaction.atomic(savepoint=False):
                res = original(*args, **kwargs)
                if simulate:
                    raise SimulationException()
        except SimulationException:
            pass

        return res

    return wrapper

class SimulationException(Exception):
    pass
