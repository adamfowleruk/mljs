# JSDoc hints and tricks

## Documenting JSON object type defs

```javascript
/**
 * Greeting person config
 * @typedef {Object} JustJson.Greeting.Person.Config
 * @property {String} firstName
 * @property {String} lastName
 */

/**
 * Greeting config
 * @typedef {Object} JustJson.Greeting.Config
 * @property {JustJson.Greeting.Person.Config} greetee
 * @property {String} greeting
 */
```
