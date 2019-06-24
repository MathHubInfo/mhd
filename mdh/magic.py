import importlib
from django.apps import apps

class MDHModel:
    pass

def get_all_generated_models():
    """ Returns all generated models"""

    # To make sure they are all loaded
    from . import models
    
    return [model for model in apps.get_app_config('mdh').get_models() if issubclass(model, MDHModel)]


def import_all_generated_models():
    """ Imports all generated models and returns a list of pairs (name, model) """
    
    try:
        from .generated import index
    except ImportError:
        raise Exception('Cannot import models: Missing index. ')
    
    return [(model, import_model(model)) for model in index]
    
def import_model(name):
    """ Imports a model with the given name and returns the given model class """

    # import the model itself
    try:
        model_module = importlib.import_module('.generated.{}'.format(name), package='mdh')
    except ImportError:
        raise
    
    # read the __all__
    try:
        model_all = getattr(model_module, '__all__')
    except:
        raise Exception('Cannot import Model {}: Missing __all__'.format(name))
    
    # get the model_class
    try:
        model_class = getattr(model_module, model_all[0])
    except:
        raise Exception('Cannot load Model {}: Invalid __all__'.format(name))
    
    # and check that it is indeed a generated model
    if not issubclass(model_class, MDHModel):
        raise Exception('Cannot load Model {}: Not an MDH class'.format(name))
    
    return model_class
