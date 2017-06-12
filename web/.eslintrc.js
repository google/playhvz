module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es6": true
    },
    "extends": [
        "eslint:recommended",
    ],
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": "off",
    },
    "globals": {
        // From utils
        "assert": "false",
        "BatchingWriter": "false",
        "CloningWriter": "false",
        "ConsistentWriter": "false",
        "GatedWriter": "false",
        "ObservableWriter": "false",
        "PlayerUtils": "false",
        "PathFindingReader": "false",
        "SimpleReader": "false",
        "SimpleWriter": "false",
        "TeeWriter": "false",
        "TimedGatedWriter": "false",
        "MappingWriter": "false",
        "Utils": "false",
        "Model": "false"
    }
};
