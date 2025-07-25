import Sandbox from '@e2b/code-interpreter'

const getSandbox = async (sandboxId: string) => {
 const sandbox = await Sandbox.connect(sandboxId)
 return sandbox
}

export default getSandbox;