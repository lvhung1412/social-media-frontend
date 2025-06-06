import React, { useEffect, useState } from 'react';
import './Register.scss';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { toast, ToastContainer } from 'react-toastify';
import * as constant from '../../constant/index';

import { useNavigate } from 'react-router-dom';
import * as UserService from '../../services/UserService';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

import { Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Logo from '../../assets/images/login/logo.jpg';

const Register = () => {
    const [name, setName] = useState('');
    const [username, setuUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const navigate = useNavigate();
    useEffect(() => {
        document.title = 'Đăng ký';
    });

    //
    const checkResult = (result) => {
        if (result.data) {
            setTimeout(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Bạn đã tạo tài khoản thành công',
                    showConfirmButton: false,
                    timer: 1000,
                });
                setTimeout(() => {
                    navigate('/login');
                }, 1000);
            }, constant.TIME_WAITING);
        } else {
            setTimeout(() => {
                Swal.fire({
                    icon: 'error',
                    title: result.message,
                    showConfirmButton: false,
                    timer: 1000,
                });
            }, constant.TIME_WAITING);
        }

        setTimeout(() => {
            toast.dismiss();
        }, constant.TIME_WAITING);
    };

    //Xử lý Register account
    const register = async () => {
        const result = await UserService.registerCustomer({
            name: name.trim(),
            username: username.trim(),
            password: password.trim(),
            email: email.trim(),
            phone: phone.trim(),
        });
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'user', username.trim()), {
                uid: res.user.uid,
                name: name.trim(),
                username: username.trim(),
                password: password.trim(),
                date: serverTimestamp(),
                email: email.trim(),
                isOnline: false,
            });
        } catch (error) {
            console.log(error);
        }

        checkResult(result);
    };
    const handleRegister = (e) => {
        e.preventDefault();

        //check format field
        if (username.trim().length < 8) {
            Swal.fire({
                icon: 'error',
                title: 'Tên đăng nhập phải có ít nhất 8 ký tự',
            });
            return;
        }

        if (constant.FORMAT.test(username.trim())) {
            Swal.fire({
                icon: 'error',
                title: 'Tên đăng nhập không được chứa khoảng trắng hoặc ký tự đặc biệt',
            });
            return;
        }

        if (constant.FORMAT_EMAIL.test(email.trim())) {
            Swal.fire({
                icon: 'error',
                title: 'Email không được chứa khoảng trắng hoặc ký tự đặc biệt',
            });

            return;
        }

        if (password.trim().length < 8) {
            Swal.fire({
                icon: 'error',
                title: 'Mật khẩu phải có ít nhất 8 ký tự',
            });

            return;
        }

        if (password.trim().search(/[0-9]/) < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Mật khẩu phải có ít nhất một chữ số',
            });

            return;
        }

        if (password.trim().search(/[a-z]/) < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Mật khẩu phải có ít nhất một chữ cái thường',
            });

            return;
        }

        if (password.trim().search(/[A-Z]/) < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Mật khẩu phải có ít nhất một chữ cái hoa',
            });

            return;
        }

        if (password.trim() !== confirm) {
            Swal.fire({
                icon: 'error',
                title: 'Mật khẩu không khớp',
            });

            return;
        }
        toast.dark('Đang chờ một chút!');
        register();
    };
    return (
        <div className="register">
            <ToastContainer />
            <div className="card">
                <Row>
                    <Col style={{ padding: '0' }}>
                        <div className="left">
                            <img src={Logo} alt="" />
                            <h1 className="title">Mạng xã hội</h1>
                            <form onSubmit={handleRegister}>
                                <input
                                    type="text"
                                    value={name}
                                    placeholder="Tên đầy đủ"
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    value={username}
                                    placeholder="Tên đăng nhập"
                                    onChange={(e) => setuUsername(e.target.value)}
                                    required
                                />
                                <input
                                    type="email"
                                    value={email}
                                    placeholder="Email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <input
                                    type="tel"
                                    value={phone}
                                    placeholder="Số điện thoại"
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    value={password}
                                    placeholder="Mật khẩu"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                <input
                                    type="password"
                                    value={confirm}
                                    placeholder="Xác nhận mật khẩu"
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                />
                                <button type="submit">Đăng ký</button>
                            </form>

                            <p className="align-left">
                                Bạn đã có tài khoản?{' '}
                                <span>
                                    <Link to="/login" className="register-now">
                                        Đăng nhập ngay
                                    </Link>
                                </span>
                            </p>
                        </div>
                    </Col>
                    <Col style={{ padding: '0' }}>
                        <div className="right"></div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Register;
