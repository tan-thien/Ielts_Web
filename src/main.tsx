import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "antd/dist/reset.css";
import "./styles/theme.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(

    <BrowserRouter>
        <LanguageProvider>
            <App />
        </LanguageProvider>

    </BrowserRouter>

);