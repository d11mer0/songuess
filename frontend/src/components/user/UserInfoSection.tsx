import React from "react";
import { Row, Col, Image } from "react-bootstrap";
import Button from "../UI/Button/Button";
import styles from "./UserInfoPage.module.css";

interface User {
  avatar?: string;
  login?: string;
  email?: string;
}

interface UserInfoSectionProps {
  user?: User;
  onEditProfile: () => void;
  onEditAvatar: () => void;
  onDelete: () => void;
}

const UserInfoSection: React.FC<UserInfoSectionProps> = ({ user, onEditProfile, onEditAvatar, onDelete }) => {
  return (
    <Row className="my-4">
      <Col md={4} className="text-center">
        <Image src={user?.avatar} roundedCircle width={150} height={150} referrerPolicy="no-referrer"/>
      </Col>
      <Col md={8}>
        <h3>{user?.login}</h3>
        <p className={styles.email}>📩 {user?.email || "Не вказано"}</p>
        <div className={styles.buttonContainer}>
          <Button variant="primary" onClick={onEditProfile} >Edit User</Button>{" "}
          <Button variant="primary" onClick={onEditAvatar} >Edit Avatar</Button>{" "}
          <Button variant="danger" onClick={onDelete} >Delete User</Button>
        </div>

      </Col>
    </Row>
  );
};

export default UserInfoSection;