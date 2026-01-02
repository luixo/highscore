import React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import { CiSettings } from "react-icons/ci";

import { LangSwitcher } from "~/entities/lang-switcher";
import { LoginModal } from "~/entities/login-modal";
import { ModeSwitch } from "~/entities/mode-switch";
import { useTranslation } from "~/utils/i18n";

export const SettingsButton: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = React.useState(false);
  return (
    <>
      <Button
        color="primary"
        variant="flat"
        isIconOnly
        onPress={() => setModalOpen(true)}
      >
        <CiSettings size={20} />
      </Button>
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent>
          <ModalHeader>{t("settings.title")}</ModalHeader>
          <ModalBody className="flex w-full flex-col gap-3">
            <ModeSwitch />
            <LangSwitcher />
            <LoginModal eventId={eventId} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
