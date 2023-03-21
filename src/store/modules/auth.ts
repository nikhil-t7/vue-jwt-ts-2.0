import { jwtDecrypt,tokenAlive } from "../../shared/jwtHelper";
import axios from "axios";

interface AuthData {
    token : string,
    refreshToken : number,
    tokenExp : number ,
    userId : string,
    userName : string
}
interface State {
    authData : AuthData,
    loginStatus : string,
    optVerificationStatus : string
}

interface LoginPayload {
    username: string;
    password: string;
}

interface OTPPayload {
    phNumber: string;
    code?: string;
}


const state = () :State => ({
    authData: {
        token: "",
        refreshToken: 0,
        tokenExp: 0,
        userId: "",
        userName: "",
    },
    loginStatus: "",
    optVerificationStatus: ""
});

//to access state
const getters = {
    getLoginStatus(state:State):string{
        return state.loginStatus;
    },
    getAuthData(state:State) :AuthData{
        return state.authData;
    },
    isTokenActive(state:State):boolean {
        if (!state.authData.tokenExp) {
            return false;
        }
        return tokenAlive(state.authData.tokenExp);
    },
    isOtpVerified(state:State) : string{
        return state.optVerificationStatus
    }
};

  //calling async calls
    const actions = {
        async login({commit}:any,payload:LoginPayload) {
            console.log(payload);
        
            const newPayload = {
                username:payload.username,
                password:payload.password
            }
            const response = await axios.post("http://localhost:3000/auth/login",newPayload)
            .catch(err => {
            console.log(err)
            })
            if(response && response.data){
                commit('saveTokenData', response.data);
                commit('setLoginStatus','success');
            }else{
                commit('setLoginStatus','failure')
            }
            
    },
    async getOTP({commit}:any,payload:OTPPayload){
        const newPayload = {
            mobileNumber:payload.phNumber
        }
        console.log("getOTP "+payload.phNumber)
        const response :any = await axios.post("http://localhost:3001/send-verification-otp",newPayload)
        .catch(err =>{
            console.log(err)
        })
        console.log(response)
        console.log(response.data.verification.status)
    },
    async verifyOTP({commit}:any,payload:OTPPayload){
        const newPayload = {
            mobileNumber:payload.phNumber,
            code:payload.code
        }
        const response :any = await axios.post("http://localhost:3001/verify-otp",newPayload)
        .catch(err =>{
            console.log(err)
        })
        console.log(response)
        console.log(response.data.verification_check.status)
        if(response && response.data){
            commit('saveOtpVerificationStatus',response.data)
        }
    },
    logout({commit}:any,payload:LoginPayload){
        commit('setLogout','')
    }
};

  //state changer for state
    const mutations = {
    saveTokenData(state:State, data:any) {
        // localStorage.setItem("access_token", data.access_token);
        // localStorage.setItem("refresh_token", data.refresh_token);

        localStorage.setItem("access_token", JSON.stringify(data.access_token));
        localStorage.setItem("refresh_token", JSON.stringify(data.refresh_token));
        
        console.log("Local Storage Access Token:"+localStorage.getItem("access_token"))

        const jwtDecodedValue = jwtDecrypt(data.access_token);
        console.log(jwtDecodedValue)
        const newTokenData = {
            token: data.access_token,
            refreshToken: data.refresh_token,
            tokenExp: jwtDecodedValue.exp,
            userId: jwtDecodedValue.sub,
            userName: jwtDecodedValue.username,
        };
        state.authData = newTokenData; 
        console.log(state.authData)
        },
        setLoginStatus(state:State, value:any){
            state.loginStatus = value;
        },
        saveOtpVerificationStatus(state:State,value:any){
            state.optVerificationStatus = value.verification_check.status
        },
        setLogout(state:State,value:any){
            state.loginStatus = ''
            state.optVerificationStatus = ''
            state.authData.token = ''
            state.authData.refreshToken = 0
            state.authData.tokenExp = 0
            state.authData.userId = ''
            state.authData.userName = ''
            localStorage.clear()
        }
};

export default{
    namespaced:true,
    state,
    getters,
    actions,
    mutations
}