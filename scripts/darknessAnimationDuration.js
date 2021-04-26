Hooks.once("init", () => {
    // register settings
    game.settings.register("darknessAnimationDuration", "customTool", {
        name: game.i18n.localize("darknessAnimationDuration.settings.customTool.name"),
        hint: "",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register("darknessAnimationDuration", "defaultDuration", {
        name: game.i18n.localize("darknessAnimationDuration.settings.defaultDuration.name"),
        hint: game.i18n.localize("darknessAnimationDuration.settings.defaultDuration.hint"),
        scope: "world",
        config: true,
        type: Number,
        default: 10000
    });
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user.isGM) return;
    const defaultDuration = game.settings.get("darknessAnimationDuration", "defaultDuration")
    const bar = controls.find(c => c.name === "lighting");
    bar.tools.find(t => t.name === "day").onClick = () => customDuration(0, defaultDuration);
    bar.tools.find(t => t.name === "night").onClick = () => customDuration(1.0, defaultDuration);
    if (game.settings.get("darknessAnimationDuration", "customTool")) {
        bar.tools.splice(3, 0, {
            name: "customTransition",
            title: "Custom Transition",
            icon: "far fa-sun",
            onClick: () => darknessAnimationDialog(),
            button: true
        });
    }
});

Hooks.once("ready", () => {
    // socket for animateDarkness duration
    game.socket.on(`module.darknessAnimationDuration`, (data) => {
        canvas.lighting.animateDarkness(data.target, { duration: data.duration });
    });

    //add function to global scope to allow macros to use
    const moduleAPI = game.modules.get("darknessAnimationDuration").api = {};
    moduleAPI.customDarknessDuration = customDuration;
});

async function darknessAnimationDialog() {
    const buttonPosition = $(document).find("li.control-tool[data-tool='customTransition']").offset();
    const options = {
        width: 300,
        top: buttonPosition.top,
        left: buttonPosition.left + 50
    }
    const content = await renderTemplate("modules/darknessAnimationDuration/templates/customAnimationDialog.hbs", { placeholder: game.settings.get("darknessAnimationDuration", "defaultDuration") });
    new Dialog({
        title: "Custom Scene Darkness Animation",
        content,
        buttons: {
            confirm: {
                label: game.i18n.localize("darknessAnimationDuration.dialog.confirm"),
                callback: async (html) => {
                    const target = parseFloat(html.find("#target").val() || parseFloat(html.find("#target").attr("placeholder")));
                    const duration = parseFloat(html.find("#duration").val() || parseFloat(html.find("#duration").attr("placeholder")));
                    console.log({sceneDarkness: game.scenes.viewed.data.darkness, target, duration});
                    if (game.scenes.viewed.data.darkness === target) return;
                    await customDuration(target, duration);
                }
            },
            cancel: {
                label: game.i18n.localize("darknessAnimationDuration.dialog.cancel"),
                callback: () => { }
            }
        },
        default: "confirm"
    }, options).render(true);
}

/**
   * Animate a smooth transition of the darkness overlay to a target value.
   * Only begin animating if another animation is not already in progress.
   * If called without second argument, duration will be set to default in module settings.
   * If called without any arguments, darkness level will be set to 1.
   * @param {number} target     The target darkness level between 0 and 1.
   * @param {number} duration   The desired animation time in milliseconds.
   */
async function customDuration(target = 1.0, duration) {
    //console.log({target, duration})
    if (canvas.lighting._animating) return;
    if (game.scenes.viewed.data.darkness === target) return;
    if (!duration) duration = game.settings.get("darknessAnimationDuration", "defaultDuration");

    // emit socket to initiate custom darkness animation on other clients
    game.socket.emit("module.darknessAnimationDuration", { target, duration });
    // initiate custom darkness animation on current client
    canvas.lighting.animateDarkness(target, { duration });
    // wait for animation to complete
    await delay();
    // actually update scene darkness level
    await game.scenes.viewed.update({ darkness: target });

    //ui.notifications.info("Scene darkness updated.");


    async function delay() {
        await new Promise(resolve => setTimeout(resolve, duration + 500));
    }
}