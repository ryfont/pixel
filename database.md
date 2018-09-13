Database schema
===============

We use a Firebase Realtime Database to manage game state.  The ground truth for this
file is at https://console.firebase.google.com/project/pixel-debate/database/pixel-debate/rules.
The schema is mirrored here since only OpenAI folk have access to that:

```
{
  "rules": {
    "games": {
      "$game": {
        ".read": "true",
        ".write": "true",
        "image": {".validate": "newData.isString()"},
        "attribution": {
          "url": {".validate": "newData.isString()"},
          "text": {".validate": "newData.isString()"},
          "$other": {".validate": false}
        },
        "gameNum": {".validate": "newData.isNumber()"},
        "players": {
          "blue": {".validate": "newData.val() == 0 || newData.val() == 1"},
          "red": {".validate": "newData.val() == 0 || newData.val() == 1"},
          "$other": {".validate": false}
        },
        "coinflip": {".validate": "newData.isNumber()"},
        "rectangles": {
          "$id": {
            "player": {".validate": "newData.val() == 'red' || newData.val() == 'blue'"},
            "x": {".validate": "newData.isNumber()"},
            "y": {".validate": "newData.isNumber()"},
            "w": {".validate": "newData.isNumber()"},
            "h": {".validate": "newData.isNumber()"},
          }
        },
        "pixels": {
          "$id": {
            "player": {".validate": "newData.val() == 'red' || newData.val() == 'blue'"},
            "x": {".validate": "newData.isNumber()"},
            "y": {".validate": "newData.isNumber()"},
          }
        },
        "$other": {".validate": false}
      }
    }
  }
}
```
