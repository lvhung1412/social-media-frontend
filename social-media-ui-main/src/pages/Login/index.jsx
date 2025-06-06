import React, { useEffect, useState } from 'react';

import * as UserService from '../../services/UserService';
import * as constant from '../../constant/index';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../action/UserAction';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

import { Modal, ModalHeader, ModalBody, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import './Login.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

import Logo from '@/assets/images/login/logo.jpg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailReset, setEmailReset] = useState('');

    const [modal, setModal] = useState(false);
    const [modal2, setModal2] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); 

    const [verificationCode, setVerificationCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [step, setStep] = useState('email'); // 'email' | 'verify' | 'reset'

    const [verificationStep, setVerificationStep] = useState(true); // true: bước nhập mã, false: bước nhập mật khẩu

    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Đăng nhập';
    });
    //Hàm kiểm tra login
    const checkLogin = (result) => {
        if (result.data) {
            setTimeout(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Bạn đã đăng nhập thành công',
                    showConfirmButton: false,
                    timer: 10,
                });
                setTimeout(() => {
                    dispatch(loginUser(result.data.userInfo, result.data.token));
                    window.location.reload();
                    navigate('/');
                }, 10);
            }, constant.TIME_WAITING);
            updateDoc(doc(db, 'user', email.trim()), {
                isOnline: true,
            });
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
    //Api kiểm tra username, password
    const login = async () => {
        const result = await UserService.loginCustomer({
            loginKey: email.trim(),
            password: password.trim(),
        });
        checkLogin(result);
    };
    //Xử lý khi login
    const handleLogin = (e) => {
        e.preventDefault();
        if (!constant.FORMAT_EMAIL.test(email.trim())) {
            toast.dark('Đợi một chút!');
            login();
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Tên đăng nhập không được chứa khoảng trắng hoặc ký tự đặc biệt! Vui lòng thử lại.',
                showConfirmButton: true,
            });
        }
    };
    const handleSubmitEmail = async (e) => {
        e.preventDefault();
        if (emailReset === '' || emailReset.length < 10) {
            Swal.fire({
                icon: 'error',
                text: 'Vui lòng nhập email của bạn và thử lại',
            });
        } else {
                setModal(!modal); // mở modal nhập mã xác thực
                const response = await UserService.sendVerify(emailReset); // gửi email xác thực
                if(response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Email đã được gửi',
                    text: 'Kiểm tra email của bạn và đặt lại mật khẩu',
                });
                setModal2(!modal2); // mở modal nhập mã xác thực
            }else {
                Swal.fire({
                    icon: 'error',
                    title: 'Thất bại',
                    text: 'Không thể gửi mã xác thực.',
                });
            }
        }
    };

        // Xử lý khi người dùng nhập mã xác thực
    const handleVerifyCode = async (e) => {
    e.preventDefault();

    try {
        const response = await UserService.verifyCode({
            email: emailReset,
            code: verificationCode,
        });
        // alert(response.success);

        // Kiểm tra kết quả trả về từ server
        if (response.success) {
            setVerificationStep(false); // chuyển sang bước nhập mật khẩu
            Swal.fire({
                icon: 'success',
                title: 'Mã xác thực hợp lệ',
                text: 'Bạn có thể thay đổi mật khẩu của mình.',
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Mã không hợp lệ',
                text: 'Vui lòng nhập đúng mã xác thực.',
            });
        }
    } catch (error) {
        // Khi server trả lỗi (ví dụ 400, 401)
        Swal.fire({
            icon: 'error',
            title: 'Xác thực không thành công',
            text: error.response?.data?.message || 'Đã xảy ra lỗi trong quá trình xác thực.',
        });
    }
};

    const handleResetPass = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Mật khẩu không khớp',
        });
        return;
    }
    if (newPassword.trim().length < 8) {
        Swal.fire({
            icon: 'error',
            title: 'Mật khẩu phải có ít nhất 8 ký tự',
        });

        return;
    }

    if (newPassword.trim().search(/[0-9]/) < 0) {
        Swal.fire({
            icon: 'error',
            title: 'Mật khẩu phải chứa ít nhất một chữ số',
        });

        return;
    }

    if (newPassword.trim().search(/[a-z]/) < 0) {
        Swal.fire({
            icon: 'error',
            title: 'Mật khẩu phải chứa ít nhất một chữ cái thường',
        });

        return;
    }

    if (newPassword.trim().search(/[A-Z]/) < 0) {
        Swal.fire({
            icon: 'error',
            title: 'Mật khẩu phải chứa ít nhất một chữ cái hoa',
        });

        return;
    }

    try {
        // Gọi API cập nhật mật khẩu ở đây nếu có
        const response = await UserService.forgetPassword({ newPassword: newPassword, email: emailReset });
        if (response.success) {
            Swal.fire({
                icon: 'success',
                title: 'Đặt lại thành công',
                text: 'Mật khẩu của bạn đã được thay đổi',
            });
            setModal2(false);
            setEmail(emailReset);
            setNewPassword('');
            setConfirmPassword('');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Đã xảy ra lỗi',
            text: 'Vui lòng thử lại',
        });
    }
};

    return (
        <div className={'login'}>
            <ToastContainer />
            <Modal centered show={modal} onHide={() => setModal(!modal)}>
            <ModalHeader closeButton={true}>
                Đặt lại mật khẩu
            </ModalHeader>
            <ModalBody>
                {step === 'email' && (
                    <form action="">
                        <Row>
                            <div className="d-flex align-items-center py-3">
                                <Col lg={2}>
                                    <label>Email:</label>
                                </Col>
                                <input
                                    required
                                    value={emailReset}
                                    onChange={(e) => setEmailReset(e.target.value)}
                                    type="email"
                                    spellCheck={false}
                                    className="form-control"
                                    placeholder="Nhập email của bạn để đặt lại"
                                />
                            </div>
                        </Row>
                        <div className="d-flex justify-content-end">
                            <button
                                onClick={handleSubmitEmail}
                                type="submit"
                                className="btn btn-primary mt-3"
                                style={{ fontSize: '1.5rem' }}
                            >
                                Gửi
                            </button>
                        </div>
                    </form>
                )}
                {step === 'verify' && (
                    <form action="">
                        <Row>
                            <div className="d-flex align-items-center py-3">
                                <Col lg={3}>
                                    <label>Mã xác thực:</label>
                                </Col>
                                <input
                                    required
                                    type="text"
                                    spellCheck={false}
                                    className="form-control"
                                    placeholder="Nhập mã xác thực"
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value)}
                                />
                            </div>
                        </Row>
                        <div className="d-flex justify-content-end">
                            <button
                                onClick={handleVerifyCode}
                                type="submit"
                                className="btn btn-primary mt-3"
                                style={{ fontSize: '1.5rem' }}
                            >
                                Xác thực mã
                            </button>
                        </div>
                    </form>
                )}
            </ModalBody>
        </Modal>
<Modal centered show={modal2} onHide={() => setModal2(!modal2)}>
    <ModalHeader closeButton={true}>Đặt lại mật khẩu</ModalHeader>
    <ModalBody>
        {/* Bước 1: Nhập mã xác thực */}
        {verificationStep ? (
            <form onSubmit={handleVerifyCode}>
                <div className="d-flex align-items-center py-3">
                    <Col lg={3}>
                        <label>Mã xác thực:</label>
                    </Col>
                    <input
                        required
                        type="text"
                        spellCheck={false}
                        className="form-control"
                        placeholder="Nhập mã xác thực"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                    />
                </div>
                <div className="d-flex justify-content-end">
                    <button
                        type="submit"
                        className="btn btn-primary mt-3"
                        style={{ fontSize: '1.5rem' }}
                    >
                        Xác thực
                    </button>
                </div>
            </form>
        ) : (
            // Bước 2: Nhập mật khẩu mới
            <form action="">
                <Row>
                    <div className="d-flex align-items-center py-3">
                        <Col lg={3}>
                            <label>Mật khẩu:</label>
                        </Col>
                        <input
                            required
                            type="password"
                            spellCheck={false}
                            className="form-control"
                            placeholder="Nhập mật khẩu mới"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div className="d-flex align-items-center py-3">
                        <Col lg={3}>
                            <label>Xác nhận mật khẩu:</label>
                        </Col>
                        <input
                            required
                            type="password"
                            spellCheck={false}
                            className="form-control"
                            placeholder="Nhập lại mật khẩu"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </Row>
                <div className="d-flex justify-content-end">
                    <button
                        onClick={handleResetPass}
                        type="submit"
                        className="btn btn-primary mt-3"
                        style={{ fontSize: '1.5rem' }}
                    >
                        Gửi
                    </button>
                </div>
            </form>
        )}
    </ModalBody>
</Modal>

            <div className={'card'}>
                <Row>
                    <Col style={{ padding: '0' }}>
                        <div className="left"></div>
                    </Col>
                    <Col style={{ padding: '0' }}>
                        <div className={'right'}>
                            <img src={Logo} alt="Logo" />
                            <h1 className={'title'}>Mạng xã hội</h1>
                            <form onSubmit={handleLogin}>
                                <input
                                    required
                                    type="text"
                                    spellCheck={false}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email, tên đăng nhập hoặc số điện thoại"
                                />
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mật khẩu"
                                />
                                <button>Đăng nhập</button>
                            </form>
                            <p className={'align-left'} style={{ cursor: 'pointer' }} onClick={() => setModal(!modal)}>
                                Quên mật khẩu?
                            </p>

                            <p className={'align-left'}>
                                Bạn chưa có tài khoản?{' '}
                                <span>
                                    <Link to="/register" className="register-now">
                                        Đăng ký ngay
                                    </Link>
                                </span>
                            </p>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Login;
