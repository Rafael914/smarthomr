import axios from "axios";
import { BASE_URL } from "../utils/api";
import React, { useState } from "react";



  export const fetchRelay = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/relay`, { timeout: 5000 });
      const data = res.data;
      if (data) {
        return{
          relay1: !!data.relay1,
          relay2: !!data.relay2,
          relay3: !!data.relay3,
          relay4: !!data.relay4,
          relay5: !!data.relay5,
        };
      }
    } catch (error: any) {
      console.log("Relay Fetch Error:", error.message);
    }
  };
