let relayState = {
    relay1:false,
    relay2:false,
    relay3:false,
    auto:false
}

export const getRelayState = async (req, res) => {
    try {
        res.status(200).json({ success:true, data:relayState});
    } catch (error) {
        res.status(500).json({ success:false, data:"getRelay server error"});
    }
}

export const postUpdateRelay = async (req, res) => {
    try {
        const {relay1, relay2, relay3, auto} = req.body;
        if(relay1 != undefined) relayState.relay1 = relay1;
        if(relay2 != undefined) relayState.relay2 = relay2;
        if(relay3 != undefined) relayState.relay3 = relay3;
        if(auto != undefined) relayState.auto = auto;
        res.status(200).json({ success:true, data:relayState, message:"relay Updated"});
    } catch (error) {
        res.status(500).json({ success: false, data: "postUpdateRelay server error"});
    }
}