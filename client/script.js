import bot from "./assets/bot.svg";
import user from "./assets/user.svg";

const form = document.querySelector("#chat_form");
const chatContainer = document.querySelector("#chat_container");
const imageUpload = document.querySelector("#image_upload");
const chooseImage = document.querySelector("#choose-img");
const imagePreview = document.querySelector("#image_preview");

let loadInterval;
let imageData;
let extension;

chooseImage.addEventListener("click", () => {
  imageUpload.click();
});

imageUpload.addEventListener("change", () => {
  const file = imageUpload.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.innerHTML = `<img src="${reader.result}" alt="Image Preview" style="max-width: 100px; max-height: 100px;" />`;
      imageData = reader.result;
      extension = file.type.split("/")[1];
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.innerHTML = "";
    imageData = undefined;
    extension = undefined;
  }
});

function loader(element) {
  element.textContent = "";
  loadInterval = setInterval(() => {
    element.textContent += ".";
    if (element.textContent === "....") {
      element.textContent = "";
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;
  const interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 10);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random().toString(16).substring(2);
  return `id-${timestamp}-${randomNumber}`;
}

function chatStripe(isAi, value, uniqueId) {
  return `
    <div class="wrapper ${isAi ? "ai" : ""}">
      <div class="chat">
        <div class="profile">
          <img src="${isAi ? bot : user}" alt="${isAi ? "bot" : "user"}" />
        </div>
        <div class="message" id="${uniqueId}">${value}</div>
      </div>
    </div>
  `;
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const userMessage = formData.get("prompt");
  chatContainer.innerHTML += chatStripe(false, userMessage);

  form.reset();
  imagePreview.innerHTML = "";

  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  try {
    const formData = new FormData();
    formData.append("prompt", userMessage);

    if (imageData) {
      formData.append("image", imageData);
    }

    if (extension) {
      formData.append("extension", extension);
    }

    const response = await fetch("http://localhost:5000", {
      method: "POST",
      body: formData,
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = " ";

    if (response.ok) {
      const data = await response.json();
      typeText(messageDiv, data.bot.trim());
    } else {
      const error = await response.text();
      messageDiv.innerHTML = "Something went wrong";
      alert(error);
    }
    imageData = undefined;
    extension = undefined;
  } catch (error) {
    clearInterval(loadInterval);
    messageDiv.innerHTML = "Something went wrong";
    alert("Failed to communicate with server");
    imageData = undefined;
    extension = undefined;
  }
};

form.addEventListener("submit", handleSubmit);
form.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    handleSubmit(e);
  }
});
