module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            builderOptions: {
                "appId": "com.trentontelge.ritual",
                "win": {
                    "target": "portable"
                },
                "portable": {
                    "unicode": false,
                    "artifactName": "ritual.exe"
                },
                "npmRebuild": true
            }
        }
    }
}
