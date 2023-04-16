(()=>{var r=Object.defineProperty,e=(e,t)=>{for(var o in r(e,"__esModule",{value:!0}),t)r(e,o,{get:t[o],enumerable:!0})},t={},o=(e(t,{bsc:()=>p,get:()=>h,getBrowserServerSetting:()=>g,scopeExtraConfigList:()=>u,userHmacSecret:()=>m}),{}),i=(e(o,{apiEndpoint:()=>i,default:()=>c,get:()=>d,labelList:()=>n,statusList:()=>a,userReadableDateFormat:()=>l}),"/f"),n={scopeBody:{global:{notification:{label:"すべての通知",summary:"すべてのサービスの通知に関する権限です。ログイン時刻などを含みます。"}},auth:{emailAddress:{label:"メールアドレス",summary:"ログインに使用するメールアドレスに関する権限です。バックアップメールアドレスは含みません。"},backupEmailAddress:{label:"バックアップメールアドレス",summary:"バックアップメールアドレスに関する権限です。ログインに使用するメールアドレスは含みません。"},userName:{label:"ユーザー名",summary:"一般公開されているユーザーの名前です。"}},service:{serviceUserId:{label:"ユーザーID",summary:"連携するサービスに提供する、あなたのアカウントのIDです。サービス毎に異なります。"},notification:{label:"サービス内通知",summary:"連携するサービス内で、通知機能を利用するための権限です。"},file:{label:"ファイル",summary:"連携するサービスで、あなたがデータを保存できます。"}}},scopeOperation:{operation:{read:"取得",write:"保存",append:"追記"},prefix:{isRequired:"必須"}},error:{undefined:"error",handle_credential_credential:"メールアドレスまたはパスワードが違います。",handle_user_add_register:"メールアドレスは既に登録されています。",handle_xlogin_code_session:"セッションが不正です。"}},a={OK:1,SUCCESS:100,LOGIN_SUCCESS:101,INVALID:1e3,NOT_ENOUGH_PARAM:1001,INVALID_SESSION:1002,API_ERROR:1100,INVALID_OIDC_ISSUER:1101,NOT_FOUND:1200},l={full:"YYYY/MM/DD hh:mm:ss",day:"YYYY/MM/DD",hourMinute:"hh:mm",time:"hh:mm:ss"},s={apiEndpoint:i,labelList:n,statusList:a,userReadableDateFormat:l},d=(...e)=>{var t=e.reduce((e,t)=>(e[t]=s[t],e),{});for(const o of e)if(!t[o])throw new Error("[error] undefined setting constant: "+o);return t},c=s,m="xlogin20220630",u={"auth:backupEmailAddress":{templateId:"#permissionCheckBlackTemplate",dialogConfirm:!0}},p=o,y={userHmacSecret:m,scopeExtraConfigList:u},g=()=>o,h=(...e)=>{var t=e.reduce((e,t)=>(e[t]=y[t],e),{});for(const o of e)if(!t[o])throw new Error("[error] undefined setting constant: "+o);return t},b={},f=(e(b,{buf2Hex:()=>L,calcHmac512:()=>M,calcPbkdf2:()=>F,genSalt:()=>_,getCaller:()=>f,getErrorModalElmAndSetter:()=>P,getModalElmAndSetter:()=>k,getRandomStr:()=>B,getRequest:()=>v,getSearchQuery:()=>Y,monkeyPatch:()=>j,postRequest:()=>S,redirect:()=>U,setOnClickNavManu:()=>A,setOnClickNotification:()=>H,showGlobalNotification:()=>R,showModal:()=>E,slideDown:()=>O,slideToggle:()=>K,slideUp:()=>N,switchLoading:()=>T}),()=>{return(new Error).stack.replace(/^Error\n.*\n.*\n/,"")}),v=(e,t={})=>{var o=t&&Object.keys(t).map(e=>e+"="+t[e]).join("&");return fetch(o?e+"?"+o:e,{method:"GET",credentials:"same-origin",timeout:3e4}).then(e=>!e.error&&e.body&&e.json?e.json():null).catch(e=>(console.error("[fatal] error @getRequest:",e),null))},S=(e,t={})=>{var o={method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},timeout:3e4};return t&&(o.body=JSON.stringify(t)),fetch(e,o).then(e=>!e.error&&e.body&&e.json?e.json():null).catch(e=>(console.error("[fatal] error @postRequest:",e),null))},w=(e,t,o=document)=>{Object.values(o.querySelectorAll(e)).forEach(e=>{t(e)})},C=()=>{w('[data-id="modal"], #modalBackground',e=>{e.classList.add("hidden")})},E=(e,o=!1)=>new Promise(t=>{"modalTemplate"===e.id&&(e.id=""),document.body.appendChild(e),C(),setTimeout(()=>{w('[data-id="modalClose"], [data-id="modalCancelButton"]',e=>{e.onclick=()=>(C(),t(!1))},document),o?e.querySelector('[data-id="modalCancelButton"]').classList.remove("hidden"):e.querySelector('[data-id="modalCancelButton"]').classList.add("hidden"),e.querySelector('[data-id="modalConfirmButton"]').onclick=()=>(C(),t(!0)),e.classList.remove("hidden"),document.querySelector("#modalBackground").classList.remove("hidden"),e.querySelector('[data-id="modalContent"]').scrollTop=0,e.querySelector('[data-id="modalCard"]').onclick=e=>{e.stopPropagation()},e.onclick=e=>(e.stopPropagation(),C(),t(!1))},100)}),P=()=>{var e=document.querySelector("#modalTemplate").cloneNode(!0);const r=e.querySelector('[data-id="modalTitle"]'),i=(r.innerText="エラー",document.createElement("p"));i.innerText="エラーが発生しました。",e.querySelector('[data-id="modalContent"]').appendChild(i);return{modalElm:e,setContent:(e,t=null,o="エラー")=>{i.innerText=t&&t[e]||e,r.innerText=o}}},k=()=>{var e=document.querySelector("#modalTemplate").cloneNode(!0);const o=e.querySelector('[data-id="modalTitle"]'),r=e.querySelector('[data-id="modalContent"]');return{modalElm:e,setContentElm:(e,t)=>{o.innerText=e,r.clearChildren(),r.appendChild(t)}}},T=e=>{var t=document.querySelector("#loading");t&&(e?t.classList.remove("hidden"):t.classList.add("hidden"))},A=()=>{var e=document.querySelector("#commonNavToggle");const t=document.querySelector("#commonNavContent");e.onclick=()=>{0<=[...t.classList.values()].indexOf("hidden")?t.classList.remove("hidden"):t.classList.add("hidden")}},q=!1,R=async e=>{e=await v(e+"/notification/global/list");const r=document.querySelector("#notificationContainer"),i=(r.clearChildren(),document.querySelector("#notificationTemplate")),n=Object.values(e?.result?.globalNotificationList||{}).reverse();n.forEach((t,e)=>{const o=i.cloneNode(!0);o.classList.remove("hidden"),o.querySelector('[data-id="subject"]').innerText=t.subject,o.onclick=e=>{e.preventDefault(),e.stopPropagation();e=document.querySelector("#modalTemplate").cloneNode(!0);e.classList.remove("hidden"),e.querySelector('[data-id="modalTitle"]').innerText=t.subject,e.querySelector('[data-id="modalContent"]').appendChild(document.createTextNode(t.detail)),E(e)},setTimeout(()=>{o.style.transitionDuration="0.5s",o.style.opacity=0,r.appendChild(o),setTimeout(()=>{o.style.opacity=1},100)},.5*e*1e3),setTimeout(()=>{o.style.transitionDuration="0.2s",o.style.opacity=0},.5*n.length*1e3+3e3+.2*e*1e3)}),setTimeout(()=>{r.clearChildren(),q=!1},.7*n.length*1e3+3e3)},H=t=>{w('[data-id="notificationBtn"]',e=>{e.onclick=e=>{e.preventDefault(),e.stopPropagation(),q||(q=!0,R(t))}})},j=()=>{void 0===Element.prototype.clearChildren&&Object.defineProperty(Element.prototype,"clearChildren",{configurable:!0,enumerable:!1,value(){for(;this.firstChild;)this.removeChild(this.lastChild)}}),void 0===window.argNamed&&(window.argNamed=e=>{const t={};return Object.keys(e).forEach(o=>{Array.isArray(e[o])?Object.assign(t,e[o].reduce((e,t)=>{if(void 0===t)throw new Error(`[error] flat argument by list can only contain function but: ${typeof t} @${o}
===== maybe you need make func exported like  module.exports = { func, } =====`);if("function"!=typeof t)throw new Error(`[error] flat argument by list can only contain function but: ${typeof t} @`+o);return e[t.name]=t,e},{})):"object"==typeof e[o]&&null!==e[o]?Object.assign(t,e[o]):t[o]=e[o]}),t})},B=e=>btoa(crypto.getRandomValues(new Uint8Array(e))).slice(0,e),L=e=>Array.prototype.map.call(new Uint8Array(e),e=>("00"+e.toString(16)).slice(-2)).join(""),M=(r,e)=>new Promise(t=>{const o=new TextEncoder("utf-8");window.crypto.subtle.importKey("raw",o.encode(e),{name:"HMAC",hash:{name:"SHA-512"}},!1,["sign","verify"]).then(e=>{window.crypto.subtle.sign("HMAC",e,o.encode(r)).then(e=>{e=new Uint8Array(e);t(L(e))})})}),_=()=>window.crypto.getRandomValues(new Uint8Array(64)),F=(o,r)=>new Promise(t=>{var e=new Uint8Array(Array.prototype.map.call(o,e=>e.charCodeAt(0)));window.crypto.subtle.importKey("raw",e,{name:"PBKDF2"},!1,["deriveBits"]).then(e=>{return window.crypto.subtle.deriveBits({name:"PBKDF2",salt:r,iterations:1e6,hash:{name:"SHA-512"}},e,512).then(e=>{t(L(e))})})}),U=e=>{e&&e.redirect&&(window.location.href=e.redirect)},Y=()=>{const o={};return window.location.search.replace(/^\?/,"").split("&").forEach(e=>{var[e,t]=e.split("=");o[e]=t}),o},N=(e,t=300)=>{e.style.height=e.offsetHeight+"px",null!==e.offsetHeight&&(e.style.transitionProperty="height, margin, padding",e.style.transitionDuration=t+"ms",e.style.transitionTimingFunction="ease",e.style.overflow="hidden",e.style.height=0,e.style.paddingTop=0,e.style.paddingBottom=0,e.style.marginTop=0,e.style.marginBottom=0,setTimeout(()=>{e.style.display="none",e.style.removeProperty("height"),e.style.removeProperty("padding-top"),e.style.removeProperty("padding-bottom"),e.style.removeProperty("margin-top"),e.style.removeProperty("margin-bottom"),e.style.removeProperty("overflow"),e.style.removeProperty("transition-duration"),e.style.removeProperty("transition-property"),e.style.removeProperty("transition-timing-function")},t))},O=(e,t=300)=>{e.style.removeProperty("display");let o=window.getComputedStyle(e)["display"];"none"===o&&(o="block"),e.style.display=o;var r=e.offsetHeight;e.style.overflow="hidden",e.style.height=0,e.style.paddingTop=0,e.style.paddingBottom=0,e.style.marginTop=0,e.style.marginBottom=0,null!==e.offsetHeight&&(e.style.transitionProperty="height, margin, padding",e.style.transitionDuration=t+"ms",e.style.transitionTimingFunction="ease",e.style.height=r+"px",e.style.removeProperty("padding-top"),e.style.removeProperty("padding-bottom"),e.style.removeProperty("margin-top"),e.style.removeProperty("margin-bottom"),setTimeout(()=>{e.style.removeProperty("height"),e.style.removeProperty("overflow"),e.style.removeProperty("transition-duration"),e.style.removeProperty("transition-property"),e.style.removeProperty("transition-timing-function")},t))},K=(e,t=300,o=!1)=>{"none"===window.getComputedStyle(e).display?O(e,t):o||N(e,t)},x={},V=(e(x,{default:()=>G,getOnSubmitRegister:()=>V}),({userHmacSecret:n,labelList:a,emailAddressInputElm:l,passInputElm:s,tosCheckElm:d,privacyPolicyCheckElm:c,calcHmac512:m,genSalt:u,calcPbkdf2:p,buf2Hex:y,switchLoading:g,redirect:h,postRegister:b,getErrorModalElmAndSetter:e,showModal:f})=>{const{modalElm:v,setContent:S}=e();return async()=>{g(!0);var e=l.value,t=s.value,o=d.checked,r=c.checked,t=await m(t,n),t=await m(t,n),i=u(),t=await p(t,i),i=y(i);b({emailAddress:e,passPbkdf2:t,saltHex:i,isTosChecked:o,isPrivacyPolicyChecked:r}).then(e=>{g(!1),e.error?(S(e.error,a.error),f(v,!1)):h(e)})}}),G={},I={},$=(e(I,{getPostRegister:()=>$,getRegisterFormElm:()=>J,setRegisterFormSubmit:()=>Q}),({apiEndpoint:e,postRequest:n})=>{const a=e+"/login/user/add";return({emailAddress:e,passPbkdf2:t,saltHex:o,isTosChecked:r,isPrivacyPolicyChecked:i})=>{e={emailAddress:e,passPbkdf2:t,saltHex:o,isTosChecked:r,isPrivacyPolicyChecked:i};return n(a,e)}}),J=()=>{return{emailAddressInputElm:document.querySelector("#emailAddressInput"),passInputElm:document.querySelector("#passInput"),tosCheckElm:document.querySelector("#tosCheck"),privacyPolicyCheckElm:document.querySelector("#privacyPolicyCheck")}},Q=({onSubmitRegister:t})=>{document.querySelector("#registerForm").onsubmit=e=>{e.preventDefault(),e.stopPropagation(),t()}},e={},D=(e.setting=t,e.lib=b,e.action=x,e.output=I,e);D.app={loadRegisterForm:()=>{var e=D.output.getPostRegister(argNamed({browserServerSetting:D.setting.bsc.get("apiEndpoint"),lib:[D.lib.postRequest]})),{emailAddressInputElm:t,passInputElm:o,tosCheckElm:r,privacyPolicyCheckElm:i}=D.output.getRegisterFormElm(),t=D.action.getOnSubmitRegister(argNamed({browserServerSetting:D.setting.bsc.get("labelList"),setting:D.setting.get("userHmacSecret"),elm:{emailAddressInputElm:t,passInputElm:o,tosCheckElm:r,privacyPolicyCheckElm:i},other:{postRegister:e},lib:[D.lib.calcHmac512,D.lib.genSalt,D.lib.calcPbkdf2,D.lib.buf2Hex,D.lib.switchLoading,D.lib.redirect,D.lib.showModal,D.lib.getErrorModalElmAndSetter]}));D.output.setRegisterFormSubmit(argNamed({onSubmit:{onSubmitRegister:t}}))},main:async()=>{D.lib.switchLoading(!0),D.lib.setOnClickNavManu(),D.lib.setOnClickNotification(D.setting.bsc.apiEndpoint),D.lib.monkeyPatch(),D.app.loadRegisterForm(),setTimeout(()=>{D.lib.switchLoading(!1)},300)}},D.app.main()})();