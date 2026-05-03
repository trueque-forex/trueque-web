	
import importlib
import json
import os
from typing import Dict, Any, Type
from backend.connectors.base import BaseConnector
from backend.connectors.defaults import GenericConnector

class ConnectorFactory:
    _instance = None
    _connectors_cache: Dict[str, BaseConnector] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConnectorFactory, cls).__new__(cls)
            cls._instance._load_config()
        return cls._instance

    def _load_config(self):
        # Determine path (similar to fee_orchestrator logic)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(current_dir, '..', '..', 'backend', 'config', 'corridor_config.json')
        
        try:
            with open(config_path, 'r') as f:
                self.full_config = json.load(f)
                # print(f"DEBUG: Config Path: {config_path}")
                # print(f"DEBUG: Loaded keys: {self.full_config.get('countries', {}).keys()}")
        except FileNotFoundError:
            print(f"Config not found at {config_path}")
            self.full_config = {}

    def get_connector(self, country_code: str) -> BaseConnector:
        """
        Returns the singleton instance of the connector for the given country.
        """
        if country_code in self._connectors_cache:
            return self._connectors_cache[country_code]
        
        # 1. Get Country Config
        countries_config = self.full_config.get("countries", {})
        country_config = countries_config.get(country_code)
        
        if not country_config:
            # Fallback to default/generic
            country_config = countries_config.get("default", {})
            connector = GenericConnector(country_config)
            self._connectors_cache[country_code] = connector
            return connector

        # 2. Determine Class Name
        class_name = country_config.get("connector_class", "GenericConnector")
        
        # 3. Dynamic Import
        # Convention: SpainConnector -> backend.connectors.spain
        # Ideally, we map names to modules, or assume a naming convention.
        # For simplicity, let's look for specific known classes or default to generic.
        
        try:
            if class_name == "SpainConnector":
                from .spain import SpainConnector
                connector = SpainConnector(country_config)
            elif class_name == "ArgentinaConnector":
                from .argentina import ArgentinaConnector
                connector = ArgentinaConnector(country_config)
            else:
                 connector = GenericConnector(country_config)
                 
        except ImportError as e:
            print(f"Error importing connector {class_name}: {e}")
            connector = GenericConnector(country_config)

        self._connectors_cache[country_code] = connector
        return connector
