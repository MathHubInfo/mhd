from django.db import transaction
import functools

def with_simulate_arg(original):
    """
        Gives a function an addional simulate argument which,
        when set, wraps the function in an aborted transaction.
    """
    @functools.wraps(original)
    @transaction.atomic
    def wrapper(*args, simulate = False, **kwargs):
        sp = transaction.savepoint()

        try:
            res = original(*args, simulate = simulate, **kwargs)
        finally:
            if simulate:
                transaction.savepoint_rollback(sp)
            else:
                transaction.savepoint_commit(sp)

        return res

    return wrapper
