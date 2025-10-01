declare module 'braintree-web-drop-in' {
  type Dropin = any
  const dropin: { create: (options: any) => Promise<any> }
  export default dropin
}