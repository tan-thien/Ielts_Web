import { useState } from "react";
import { register } from "../../services/auth.service";
import type { RegisterRequest } from "../../types/auth";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState<RegisterRequest>({
        Email: "",
        Password: "",
        Name: "",
        Gender: "male",
        Phone: "",
        Address: "",
        Birthday: "",
        Avatar: "",
    });

    const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
        ...prev,
        [name]:
        name === "Gender"
            ? (value as "male" | "female" | "other")
            : value,
    }));
    };

  const handleRegister = async () => {
    try {
      const result = await register(form);
      alert(result.message);
      console.log(result);
      navigate("/login");

    } catch (error: any) {
      alert(error.response?.data?.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>

      <input
        name="Email"
        placeholder="Email"
        onChange={handleChange}
      />

      <br />

      <input
        name="Password"
        type="password"
        placeholder="Password"
        onChange={handleChange}
      />

      <br />

      <input
        name="Name"
        placeholder="Name"
        onChange={handleChange}
      />

      <br />

      <select
        name="Gender"
        onChange={handleChange}
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      <br />

      <input
        name="Phone"
        placeholder="Phone"
        onChange={handleChange}
      />

      <br />

      <input
        name="Address"
        placeholder="Address"
        onChange={handleChange}
      />

      <br />

      <input
        name="Birthday"
        type="date"
        onChange={handleChange}
      />

      <br />

      <input
        name="Avatar"
        placeholder="Avatar URL"
        onChange={handleChange}
      />

      <br />

      <button onClick={handleRegister}>
        Register
      </button>
    </div>
  );
}

export default RegisterPage;