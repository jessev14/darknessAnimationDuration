# Darkness Animation Duration
FoundryVTT module that allows users to set a custom duration for the scene darkness animation.

# Usage
A custom default animation duration (in milliseconds) can be set in the module settings. The Foundry default is 10000msec (10sec).
Clicking the Transition to Day/Night buttons in the Light toolbar will change the scene darkness to 0/1.0 with the set duration.

A custom button is added to the Light toolbar that lets users input a target light darkness level and duration. The button can be removed in the module settings.

A custom scene darkness transition can also be triggered programmatically:
```js
game.modules.get("darknessAnimationDuration").api.customDarknessDuration(darknessLevel, duration);
```

# Technical Notes
A socket is used to initate the animation on other clients. The `LightingLayer#animateDarkness` core function is used to initiate animation on the current client.
After animation ends the scene darkness is manually updated.

I submitted [this issue](https://gitlab.com/foundrynet/foundryvtt/-/issues/4715) to the core Foudndry repo so I fully expect this module to become obsolete at some point.
I've just been using this for my own purposes and thought I might as well clean it up and share.

If you run into any issues, please reach out: `enso#0361`
