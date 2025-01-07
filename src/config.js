var currentConfig


const loadData = async () => {
    return await browser.storage.local.get("config")
}


// merges the updates the config data
const makeConfig = async (newConfigData) => {
    const config = {...currentConfig, ...newConfigData}
    return {config}
}


const addPreToConfig = (data) => {
    if (!data?.prePrompt) return data
    const prePrompts = currentConfig?.prePrompts || []
    console.log("🚀 ~ addPreToConfig ~ prePrompts:", prePrompts,  currentConfig?.prePrompts)
    prePrompts.push(data.prePrompt)

    return {prePrompts}
}


const removePreToConfig = (index) => {
    const prePrompts = currentConfig?.prePrompts

    if (!prePrompts?.length) return

    prePrompts.splice(index, 1)

    const confirmed = confirm("Do you want to delete this pre-prompt?")
    if (!confirmed) return 
    saveData({prePrompts})
}


// you can potentially add other transformations
const transformData = (data) => {
    data = addPreToConfig(data)
    return data
}


const saveData = async (data) => {
    data = transformData(data)
    const config = await makeConfig(data)
    browser.storage.local.set(config)
}


function addPrePromptNode(prepromptListContainer, prePrompt, index) {
    const li = document.createElement('li');
    li.className = "prePrompt-item"

    prePromptNormalMode(prePrompt, li, index)

    prepromptListContainer.appendChild(li);
}


const prePromptEditMode = (prePrompt, li, index) => {
    li.innerHTML = `
        <textarea class="input" rows="3">${prePrompt}</textarea>
        <div class="button-container">
            <button class="button save">save</button>
            <button class="button cancel muted">cancel</button>
        </div>
   `
    const textareaNode = li.querySelector("textarea")

    // focus at the end of the string
    textareaNode.focus()
    const textValue = textareaNode.value
    textareaNode.value = ""
    textareaNode.value = textValue

    li
        .querySelector(".cancel")
        .addEventListener("click", () => prePromptNormalMode(prePrompt, li, index))


    li
        .querySelector(".save")
        .addEventListener("click", () => updatePreprompt(li, index))
}


const updatePreprompt = (li, index) => {
    const textareaValue = li.querySelector("textarea").value

    const prePrompts = currentConfig.prePrompts

    prePrompts[index] = textareaValue

    saveData({prePrompts})

    return 
}


const prePromptNormalMode = (prePrompt, li, index) => {
    li.innerHTML = `
        <p>${prePrompt}</p>
        <div class="button-container">
            <button class="button edit muted">edit</button>
            <button class="button delete">delete</button>
        </div>
    `;

    li
        .querySelector(".delete")
        .addEventListener("click", () => removePreToConfig(index))


    li
        .querySelector(".edit")
        .addEventListener("click", () => prePromptEditMode(prePrompt, li, index))
}


const setupPrepromptsNode  = (config) => {
    const prePromptListNode = document.getElementById("prePromptList")
    
    prePromptListNode.innerHTML = ""
    const prePromptList = config?.prePrompts
    
    if (!prePromptList?.length) {
        const li = document.createElement('li');
        
        li.id = "empty-preprompt-list"
        li.innerHTML = `
            <p>Start adding pre-prompts</p>
        `
        
        prePromptListNode.appendChild(li)
    } else {
        prePromptList?.forEach((prePrompt, index) => {
            addPrePromptNode(prePromptListNode, prePrompt, index)
        })
    }
}


const setupFormNode = (config) => {
    // clean the api form if no config
    if (!Object.keys(config).length) {
        document.querySelector("form").reset()
    }

    // prefill the form
    for (const [key, value] of Object.entries(config)) {
        const urlField = document.getElementById(key)

        if (urlField) {
            urlField.value = value || ""
        }
    }
}


const notifications = () => {
    const div = document.createElement("div")
    div.id = "notification"
    div.innerHTML = `
        <p>Action executed</p>
    `
    document.body.appendChild(div)

    setTimeout(() => {
        div.remove()
    }, 2000);
}


async function textButtonOnClick(e) {
    
    const nodeText = this.innerText

    this.innerText = "please wait ..."
    
    const errorAlert = (error) => {
        alert(`Your configuration is wrong or the api might not accept requests from this extension. Check your api, the model version and CORS configuration \n\n Error: ${error?.message || error || ""}`)
        console.error(error)
        this.innerText = nodeText
    }

    if(!currentConfig?.url || !currentConfig?.model) {
        errorAlert()
        return
    }

    try {
        const url = `${currentConfig.url}/api/generate`
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                prompt: "Is very thing all good",
                model: currentConfig.model
            })
        })

        if (!response.ok) {
            const error = (await response.json())?.error
            errorAlert(error || response.statusText)
            return
        }

        alert("All good")
    } catch (error) {
        errorAlert(error)
    } finally {
        this.innerText = nodeText
    }
}



const setUpNodes = (config) => { 
    setupFormNode(config)
    setupPrepromptsNode(config)
}


browser.storage.onChanged.addListener((changes, areaName) => {
  
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        currentConfig = newValue ? {...oldValue, ...newValue}: {}
        
        setUpNodes(currentConfig)
        notifications()
    }

});


const deleteConfig = () => {
    browser.storage.local.clear()
}

function formSubmitHandler(e) {
    e.preventDefault()

    const form = e.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries());
    
    saveData(data)

    // clear textarea
    const textarea = form.querySelector("textarea")
    if(textarea) {
        textarea.value = ""
    }
}

const domLoaded = async () => {
    // test config button
    const testButton = document.getElementById("test-config")
    testButton.addEventListener("click", textButtonOnClick)

    // forms
    const formNodes = document.getElementsByClassName("submit-form")
    for (const form of formNodes) {
        form.addEventListener("submit", formSubmitHandler)
    }
    
    // delete config
    document.getElementById("delete-all")?.addEventListener("click", () => {
        deleteConfig()
    }) 

    // update the current config and change the dom
    currentConfig = (await loadData("config"))?.config || {}
    setUpNodes(currentConfig)
}


window.addEventListener('DOMContentLoaded', domLoaded)