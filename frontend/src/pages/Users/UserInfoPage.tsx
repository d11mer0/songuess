import React, { useState } from "react";
import { useGetMeQuery } from "../../store/api/userApi";
import { Container } from "react-bootstrap";
import UserInfoSection from "../../components/user/UserInfoSection";
import DeleteUser from "../../components/user/DeleteUser";
import EditAvatar from "../../components/user/EditAvatar";
import EditUserProfile from "../../components/user/EditUserProfile";

const UserInfoPage: React.FC = () => {
  const { data: user, isLoading } = useGetMeQuery();
  
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showEditAvatar, setShowEditAvatar] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  if (isLoading) return <p>Loading...</p>;

  return (
    <Container>
      <UserInfoSection 
        user={user} 
        onEditProfile={() => setShowEditProfile(true)}
        onEditAvatar={() => setShowEditAvatar(true)}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <EditUserProfile 
        show={showEditProfile} 
        onClose={setShowEditProfile} 
      />
      <EditAvatar 
        user={user!} 
        show={showEditAvatar} 
        onClose={setShowEditAvatar} 
      />
      <DeleteUser 
        show={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
      />
    </Container>
  );
};

export default UserInfoPage;