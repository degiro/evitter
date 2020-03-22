module.exports = {
    'coverageDirectory': 'coverage',
    'coverageReporters': [
        'html'
    ],
    'collectCoverageFrom': [
        'src/*.ts'
    ],
    'coverageThreshold': {
        'global': {
            'statements': 100,
            'branches': 96.49,
            'functions': 100,
            'lines': 100
        }
    },
    'testRegex': '__tests__/.+\.spec\.(ts|js)$',
    'testPathIgnorePatterns': [
        '/node_modules/'
    ],
    'transform': {
        '.(ts|js)$': 'ts-jest'
    },
    'coveragePathIgnorePatterns': [
        '/node_modules/',
        '/__tests__/'
    ],
    'moduleFileExtensions': [
        'ts',
        'js'
    ]
};