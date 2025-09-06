import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Badge,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from "@chakra-ui/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import type { InboundConfig } from "../types/InboundTypes";
import { useInboundManager } from "../hooks/useInboundManager";
import { TemplateSelector } from "./TemplateSelector";
import { InboundEditor } from "./InboundEditor";

interface InboundManagerProps {
  existingInbounds: InboundConfig[];
  onInboundsChange: (inbounds: InboundConfig[]) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export const InboundManager: FC<InboundManagerProps> = ({
  existingInbounds,
  onInboundsChange,
  isLoading: externalLoading = false,
  isReadOnly = false
}) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  // Модальное окно для подтверждения удаления
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [inboundToDelete, setInboundToDelete] = useState<InboundConfig | null>(null);

  // Хук управления инбаундами
  const {
    state,
    isLoading: managerLoading,
    existingTags,
    occupiedPorts,
    startCreate,
    startEdit,
    startDuplicate,
    deleteInbound,
    selectTemplate,
    saveInbound,
    updateInbound,
    cancel,
    getFormDefaults,
    validateForm,
    isValidating,
    isCreating
  } = useInboundManager(existingInbounds);

  const isLoading = externalLoading || managerLoading;

  // Обработчики удаления
  const handleDeleteClick = (inbound: InboundConfig) => {
    setInboundToDelete(inbound);
    onDeleteOpen();
  };

  const handleConfirmDelete = () => {
    if (inboundToDelete) {
      deleteInbound(inboundToDelete);
      const updatedInbounds = existingInbounds.filter(i => i.tag !== inboundToDelete.tag);
      onInboundsChange(updatedInbounds);
    }
    setInboundToDelete(null);
    onDeleteClose();
  };

  // Обработчик сохранения
  const handleSave = async (formData: any) => {
    let success = false;

    if (state.mode === 'create' || state.mode === 'duplicate') {
      success = await saveInbound(formData);
    } else if (state.mode === 'edit') {
      success = await updateInbound(formData);
    }

    if (success) {
      // Обновление родительского компонента
      onInboundsChange(state.existingInbounds);
    }

    return success;
  };

  // Отображение загрузки
  if (isLoading) {
    return (
      <Center h="200px">
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text>{t('Loading inbounds...')}</Text>
        </VStack>
      </Center>
    );
  }

  // Отображение селектора шаблонов
  if (state.mode === 'create' && !state.selectedTemplate) {
    return (
      <TemplateSelector
        templates={state.templates}
        categories={state.categories}
        selectedTemplate={state.selectedTemplate}
        onTemplateSelect={selectTemplate}
        onCancel={cancel}
        isLoading={isLoading}
      />
    );
  }

  // Отображение редактора
  if (state.mode !== 'list') {
    return (
      <InboundEditor
        template={state.selectedTemplate}
        initialData={state.editingInbound}
        mode={state.mode}
        existingTags={existingTags}
        occupiedPorts={occupiedPorts}
        onSave={handleSave}
        onCancel={cancel}
        isLoading={isValidating || isCreating}
      />
    );
  }

  // Отображение списка инбаундов
  return (
    <>
      <Box
        bg={bgColor}
        borderRadius="md"
        border="1px"
        borderColor={borderColor}
        p={6}
      >
        <VStack spacing={6} align="stretch">
          {/* Заголовок и статистика */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="semibold">
                {t('Inbound Configuration')}
              </Text>
              <HStack spacing={4}>
                <Text fontSize="sm" color="gray.500">
                  {t('Total')}: {existingInbounds.length}
                </Text>
                {existingInbounds.length > 0 && (
                  <HStack spacing={2}>
                    {Object.entries(
                      existingInbounds.reduce((acc, inbound) => {
                        acc[inbound.protocol] = (acc[inbound.protocol] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([protocol, count]) => (
                      <Badge key={protocol} size="sm" colorScheme="blue">
                        {protocol.toUpperCase()}: {count}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </HStack>
            </VStack>

            {!isReadOnly && (
              <Button
                leftIcon={<PlusIcon width="16" height="16" />}
                colorScheme="blue"
                size="sm"
                onClick={startCreate}
                isDisabled={isLoading}
              >
                {t('Add Inbound')}
              </Button>
            )}
          </HStack>

          <Divider />

          {/* Список существующих инбаундов */}
          {existingInbounds.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>{t('No inbounds configured')}</AlertTitle>
                <AlertDescription>
                  {!isReadOnly 
                    ? t('Click "Add Inbound" to create your first inbound configuration.')
                    : t('No inbound configurations are currently set up.')
                  }
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <VStack spacing={3} align="stretch">
              {existingInbounds.map((inbound) => (
                <Box
                  key={inbound.tag}
                  p={4}
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  bg={useColorModeValue("gray.50", "gray.700")}
                >
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="medium" fontSize="md">{inbound.tag}</Text>
                      <HStack spacing={3}>
                        <Badge colorScheme="blue">
                          {inbound.protocol.toUpperCase()}
                        </Badge>
                        <Text fontSize="sm" color="gray.500">
                          Port: {inbound.port}
                        </Text>
                        {inbound.streamSettings?.network && (
                          <Badge variant="outline" size="sm">
                            {inbound.streamSettings.network.toUpperCase()}
                          </Badge>
                        )}
                        {inbound.streamSettings?.security && (
                          <Badge 
                            variant="outline" 
                            size="sm"
                            colorScheme={inbound.streamSettings.security === 'reality' ? 'purple' : 'gray'}
                          >
                            {inbound.streamSettings.security.toUpperCase()}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>

                    {!isReadOnly && (
                      <HStack spacing={2}>
                        <Tooltip label={t('Edit inbound')}>
                          <Button
                            size="sm"
                            onClick={() => startEdit(inbound)}
                            isDisabled={isLoading}
                          >
                            {t('Edit')}
                          </Button>
                        </Tooltip>
                        
                        <Tooltip label={t('Duplicate inbound')}>
                          <Button
                            size="sm"
                            onClick={() => startDuplicate(inbound)}
                            isDisabled={isLoading}
                          >
                            {t('Duplicate')}
                          </Button>
                        </Tooltip>
                        
                        <Tooltip label={t('Delete inbound')}>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleDeleteClick(inbound)}
                            isDisabled={isLoading}
                          >
                            {t('Delete')}
                          </Button>
                        </Tooltip>
                      </HStack>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('Confirm Deletion')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {t('Are you sure you want to delete inbound "{{tag}}"? This action cannot be undone.', {
                tag: inboundToDelete?.tag
              })}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onDeleteClose}>
              {t('Cancel')}
            </Button>
            <Button colorScheme="red" onClick={handleConfirmDelete}>
              {t('Delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};