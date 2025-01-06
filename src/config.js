let oldConfig
function formSubmitHandler(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries());
    saveData(data)
}

const loadData = async () => {
    return await browser.storage.local.get("config")
}

const makeConfig = async (data) => {
    const config = {...oldConfig, ...data}
    return {config}
}

const addPreToConfig = (data) => {
    if (!data?.prePrompt) return data
    const prePrompts = oldConfig?.prePrompts || []
    prePrompts.push(data.prePrompt)

    return {prePrompts}
}

const removePreToConfig = (index) => {
    const prePrompts = oldConfig?.prePrompts

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

    const prePrompts = oldConfig.prePrompts

    prePrompts[index] = textareaValue

    saveData({prePrompts})

    return 
}

const prePromptNormalMode = (prePrompt, li, index) => {
    li.innerHTML = `
        <p>${prePrompt}</p>
        <div class="button-container">
            <button class="button edit muted" >edit</button>
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

const setupUrlNode = (config) => {
    // url
    const urlField = document.getElementById("url")
    if (urlField) {
        urlField.value = config?.url || ""
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
    // console.log("dfja;sdfj", e)
}

const setUpNodes = (config) => { 
    setupUrlNode(config)
    setupPrepromptsNode(config)
}

const domLoaded = async () => {
    const formNodes = document.getElementsByClassName("submit-form")
    for (const form of formNodes) {
        form.addEventListener("submit", formSubmitHandler)
    }
    
    document.getElementById("delete-all")?.addEventListener("click", () => {
        deleteConfig()
    }) 

    oldConfig = (await loadData("config"))?.config
    
    setUpNodes(oldConfig)
}


browser.storage.onChanged.addListener((changes, areaName) => {
    console.log(`Changes in storage area: ${areaName}`);
  
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        let configValue = {...oldValue, ...newValue }
        
        if (!newValue) {
            configValue = {}
        }
        setUpNodes(configValue)

        notifications()
    }

});
  

const deleteConfig = () => {
    browser.storage.local.clear()
}

// Check storage quota and usage
// navigator.storage.estimate().then(estimate => {
//     const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
//     const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
//     const usedPercentage = (estimate.usage / estimate.quota) * 100;
  
//     console.log(`Total quota: ${quotaMB} MB`);
//     console.log(`Used storage: ${usageMB} MB`);
//     console.log(`Used: ${usedPercentage.toFixed(2)}% of the available quota`);
// }).catch(error => {
//     console.error('Error estimating storage:', error);
// });

window.addEventListener('DOMContentLoaded', domLoaded)