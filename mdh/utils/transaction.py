from django.db import transaction
import functools

def with_simulate_arg(original):
    """
        Gives a function an addional simulate argument which,
        when set, wraps the function in an aborted transaction.
    """
    @functools.wraps(original)
    def wrapper(*args, simulate = False, **kwargs):

        res = None
        try:
            with transaction.atomic():
                res = original(*args, simulate = simulate, **kwargs)
                if simulate:
                    raise SimulationException()

        except SimulationException:
            pass

        return res

    return wrapper

class SimulationException(Exception):
    pass
