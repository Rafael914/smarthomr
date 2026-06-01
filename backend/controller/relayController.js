// relayController.js

let relayState = {
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
    relay5: false, 
    auto: false
};

export const getRelayState = async (req, res) => {
    try {
        res.status(200).json(relayState);
    } catch (error) {
        res.status(500).json({ error: "getRelay server error" });
    }
};

export const postUpdateRelay = async (req, res) => {
    try {
        console.log("Incoming request body:", req.body);

        // Destructure from the incoming request body (Expanded to 5 relays)
        const { relay1, relay2, relay3, relay4, relay5, auto } = req.body;

        if (relay1 !== undefined)
            relayState.relay1 = relay1;

        if (relay2 !== undefined)
            relayState.relay2 = relay2;

        if (relay3 !== undefined)
            relayState.relay3 = relay3;

        if (relay4 !== undefined)
            relayState.relay4 = relay4;

        if (relay5 !== undefined)
            relayState.relay5 = relay5;

        if (auto !== undefined)
            relayState.auto = auto;

        console.log("Updated state:", relayState);

        res.status(200).json({
            success: true,
            data: relayState
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false
        });
    }
};