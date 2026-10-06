# Get Started with Codryn Desktop

Welcome to Codryn Desktop. In just a few minutes you will install the app, open your project, connect your AI provider, and start chatting.

## Install Codryn

Installation is a single command and it sets up both the backend and the desktop app for you.

If you are on Windows, open PowerShell and run this:

```powershell
powershell -c "irm https://raw.githubusercontent.com/BlankPage-Ctrl/Codryn/master/installs/install.ps1 | iex"
```

If you are on Linux, open your terminal and run this:

```bash
curl -fsSL https://raw.githubusercontent.com/BlankPage-Ctrl/Codryn/master/installs/install.sh | bash
```

Wait until it finishes, then move on to opening the app.

## Open Codryn

On Linux, open the App Menu and type Codryn. On Windows, open the Start Menu and type Codryn, then launch it.

*Tip: on Linux, Codryn lives under the Programming or Development category, so check there if you browse by category instead of searching.*

## Create your first workspace

Once Codryn is open, look at the top left corner. Next to your workspace name you will see a **+** button. Press it to create a new workspace.

Give your workspace a clear **Name** so you recognize it later, then set the **Project Path** to the folder of the project you want to work on. Press **Create** and Codryn will open that workspace for you right away.

## Set some settings before starting things

Now look at the top right corner. You will see a gear icon <img src="./assets/gear.svg" width="14" height="14" alt="Settings gear icon" /> for **Settings**. Click it to open the settings tab.

### Add your provider
Inside you will find the provider section. Press **Add provider** to add a new one. Pick the **Type** that matches your Provider, give it a **Name** you like, and paste in your **API key**.

> [!TIP]
> Tip: if your provider needs a custom endpoint, click **Custom base URL** at the bottom left of the dialog to reveal the **Base URL** field, then fill it in.*

> [!IMPORTANT]
> If you don't have an API key yet, try creating one at [OpenAI](https://platform.openai.com/api-keys)(paid) or try it for free at [OpenRouter](https://openrouter.ai/workspaces/default/keys)(which offers several free models).

> [!WARNING]
> Some providers may not be available natively, but you might be able to try using the OpenAI Compatible API if your provider provides a connection via the OpenAI Compatible API.

Save it and you will see your new provider appear in the list.

### Add your models

Every provider needs at least one model before you can chat. Find your provider in the list and press the **+** button on its card to register a model you have access to, After you add several models, expand them, and you will see the models you just added.
> [!TIP]
> You can make the Model that you often use the Default Option, hover over that model row and press the **Star** button. That model becomes your <u>default</u> and gets a small **Default** badge, so every new chat uses it automatically.

## Start your first chat

Everything is ready. Press **Create Chat** and start talking to your project. Ask about your code, plan a change, or just explore what Codryn can do.
