import { useState } from "react";
import { FaGlobe, FaLanguage } from "react-icons/fa";
import { useLanguage } from "../../i18n/useLanguage";
import type { AppLanguage } from "../../i18n/translations";
import "./SettingsPage.css";

function SettingsPage({ isAdmin = false }: { isAdmin?: boolean }) {
    const { language, setLanguage } = useLanguage();
    const [saved, setSaved] = useState(false);

    const handleLanguageChange = (nextLanguage: AppLanguage) => {
        setLanguage(nextLanguage);
        setSaved(true);
    };

    return (
        <main className="settings-page">
            <header className="settings-page-header">
                <span className="settings-page-eyebrow">
                    {isAdmin ? "ADMIN SETTINGS" : "ACCOUNT SETTINGS"}
                </span>
                <h1>{isAdmin ? "Cài đặt quản trị" : "Cài đặt"}</h1>
                <p>Tùy chỉnh trải nghiệm sử dụng website.</p>
            </header>

            <section className="settings-card">
                <div className="settings-card-heading">
                    <span className="settings-language-icon"><FaGlobe /></span>
                    <div>
                        <h2>Cài đặt ngôn ngữ</h2>
                        <p>Chọn ngôn ngữ muốn sử dụng trên website.</p>
                    </div>
                </div>
                <label className="settings-language-label" htmlFor="settings-language">
                    Ngôn ngữ hiển thị
                </label>
                <div className="settings-language-select-wrap">
                    <FaLanguage aria-hidden="true" />
                    <select
                        id="settings-language"
                        value={language}
                        onChange={(event) => handleLanguageChange(event.target.value as AppLanguage)}
                    >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                    </select>
                </div>
                <p className="settings-language-help">
                    Tùy chọn ngôn ngữ được lưu trên thiết bị này.
                </p>
                {saved && <p className="settings-saved" role="status">Ngôn ngữ đã được cập nhật.</p>}
            </section>
        </main>
    );
}

export default SettingsPage;
