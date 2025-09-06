import {
  Box,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Button,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Switch,
  Textarea,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Alert,
  AlertIcon,
  Code,
  useColorModeValue,
  Divider,
  Badge,
  Tooltip
} from "@chakra-ui/react";
import { FC, useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type {
  InboundTemplate,
  InboundConfig,
  InboundFormData,
  ValidationResult
} from "../types/InboundTypes";
import { validateInboundForm } from "../schemas/inboundSchemas";
import { GenerationUtils } from "../config/inboundConfig";

interface InboundEditorProps {
  template?: InboundTemplate;
  initialData?: InboundConfig;
  mode: 'create' | 'edit' | 'duplicate';
  existingTags: string[];
  occupiedPorts: number[];
  onSave: (config: InboundConfig) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InboundEditor: FC<InboundEditorProps> = ({
  template,
  initialData,
  mode,
  existingTags,
  occupiedPorts,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const codeColor = useColorModeValue("gray.100", "gray.700");

  // Состояние для превью JSON
  const [showPreview, setShowPreview] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Форма
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<InboundFormData>({
    defaultValues: {
      templateId: template?.id || '',
      tag: initialData?.tag || GenerationUtils.generateUniqueTag(
        template?.name.toLowerCase().replace(/\s+/g, '_') || 'inbound',
        existingTags
      ),
      port: initialData?.port || template?.defaultPort || GenerationUtils.generateRandomPort(occupiedPorts),
      editableValues: {},
      advancedValues: {}
    }
  });

  const formData = watch();

  // Автогенерация значений при выборе шаблона
  useEffect(() => {
    if (template && mode === 'create') {
      // Автогенерация UUID или паролей
      const autoValues: Record<string, any> = {};
      
      template.autoGenFields.forEach(field => {
        switch (field) {
          case 'uuid':
            autoValues[field] = GenerationUtils.generateUUID();
            break;
          case 'password':
            autoValues[field] = GenerationUtils.generatePassword();
            break;
        }
      });

      setValue('editableValues', autoValues);
    }
  }, [template, mode, setValue]);

  // Валидация в реальном времени
  useEffect(() => {
    if (formData.tag && formData.port) {
      const result = validateInboundForm(formData, existingTags, occupiedPorts);
      setValidationResult(result);
    }
  }, [formData, existingTags, occupiedPorts]);

  // Генерация превью конфигурации
  const previewConfig = useMemo(() => {
    if (!template) return null;

    const config: InboundConfig = {
      tag: formData.tag,
      port: formData.port,
      protocol: template.protocol,
      settings: {
        ...template.baseConfig.settings,
        ...formData.editableValues
      },
      streamSettings: template.baseConfig.streamSettings,
      sniffing: template.baseConfig.sniffing
    };

    return config;
  }, [template, formData]);

  // Обработка отправки формы
  const onSubmit = (data: InboundFormData) => {
    if (!template || !previewConfig) return;

    // Финальная валидация
    const validation = validateInboundForm(data, existingTags, occupiedPorts);
    if (!validation.isValid) {
      setValidationResult(validation);
      return;
    }

    onSave(previewConfig);
  };

  // Генерация нового значения
  const handleGenerate = (field: string) => {
    let newValue: string;
    
    switch (field) {
      case 'uuid':
        newValue = GenerationUtils.generateUUID();
        break;
      case 'password':
        newValue = GenerationUtils.generatePassword();
        break;
      case 'port':
        setValue('port', GenerationUtils.generateRandomPort(occupiedPorts));
        return;
      default:
        return;
    }

    setValue(`editableValues.${field}`, newValue);
  };

  if (!template) {
    return (
      <Alert status="error">
        <AlertIcon />
        {t('Template not selected')}
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Информация о шаблоне */}
      <Box p={4} bg={bgColor} borderRadius="md" border="1px" borderColor={borderColor}>
        <HStack spacing={3}>
          <Text fontSize="lg">{template.icon}</Text>
          <VStack align="start" spacing={1}>
            <Text fontWeight="semibold">{template.name}</Text>
            <HStack spacing={2}>
              <Badge colorScheme="blue">{template.protocol.toUpperCase()}</Badge>
              <Badge colorScheme="gray">{template.transport}</Badge>
              <Badge colorScheme="purple">{template.security}</Badge>
            </HStack>
          </VStack>
        </HStack>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={6} align="stretch">
          {/* Обязательные поля */}
          <Box>
            <Text fontSize="md" fontWeight="medium" mb={4}>
              {t('Required Fields')}
            </Text>
            
            <VStack spacing={4} align="stretch">
              {/* Tag */}
              <FormControl isInvalid={!!errors.tag}>
                <FormLabel>{t('Tag')}</FormLabel>
                <Controller
                  name="tag"
                  control={control}
                  rules={{ required: t('Tag is required') }}
                  render={({ field }) => <Input {...field} />}
                />
                <FormErrorMessage>{errors.tag?.message}</FormErrorMessage>
              </FormControl>

              {/* Port */}
              <FormControl isInvalid={!!errors.port}>
                <FormLabel>{t('Port')}</FormLabel>
                <HStack>
                  <Controller
                    name="port"
                    control={control}
                    rules={{ required: t('Port is required') }}
                    render={({ field }) => (
                      <NumberInput {...field} min={1} max={65535}>
                        <NumberInputField />
                      </NumberInput>
                    )}
                  />
                  <Tooltip label={t('Generate random port')}>
                    <Button size="sm" onClick={() => handleGenerate('port')}>
                      🎲
                    </Button>
                  </Tooltip>
                </HStack>
                <FormErrorMessage>{errors.port?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Box>

          {/* Настраиваемые поля */}
          {template.editableFields.length > 0 && (
            <Box>
              <Text fontSize="md" fontWeight="medium" mb={4}>
                {t('Configuration')}
              </Text>
              
              <VStack spacing={4} align="stretch">
                {template.editableFields.map(field => (
                  <FormControl key={field}>
                    <FormLabel>{t(field)}</FormLabel>
                    <HStack>
                      <Controller
                        name={`editableValues.${field}`}
                        control={control}
                        render={({ field: formField }) => <Input {...formField} />}
                      />
                      {(field === 'uuid' || field === 'password') && (
                        <Tooltip label={`Generate ${field}`}>
                          <Button size="sm" onClick={() => handleGenerate(field)}>
                            🎲
                          </Button>
                        </Tooltip>
                      )}
                    </HStack>
                  </FormControl>
                ))}
              </VStack>
            </Box>
          )}

          {/* Продвинутые настройки */}
          {template.advancedFields.length > 0 && (
            <Accordion allowToggle>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium">{t('Advanced Settings')}</Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {template.advancedFields.map(field => (
                      <FormControl key={field}>
                        <FormLabel>
                          <HStack>
                            <Text>{t(field)}</Text>
                            {/* Индикаторы для специальных полей */}
                            {field.includes('fragment') && (
                              <Badge size="sm" colorScheme="cyan" variant="outline">
                                🧩 Fragment
                              </Badge>
                            )}
                            {field.includes('noise') && (
                              <Badge size="sm" colorScheme="teal" variant="outline">
                                🌊 Noise
                              </Badge>
                            )}
                            {field.includes('fallback') && (
                              <Badge size="sm" colorScheme="orange" variant="outline">
                                🔀 Fallback
                              </Badge>
                            )}
                          </HStack>
                        </FormLabel>
                        
                        <Controller
                          name={`advancedValues.${field}`}
                          control={control}
                          render={({ field: formField }) => (
                            field.includes('setting') || field.includes('fallback') ? 
                              <Box>
                                <Textarea {...formField} rows={4} placeholder={
                                  field.includes('fragment') ? 
                                    'packets: tlshello\nlength: 100-200\ninterval: 10-20' :
                                  field.includes('noise') ?
                                    'type: rand\nlength: 100-200' :
                                  field.includes('fallback') ?
                                    '{"dest": "example.com:443", "xver": 0}' :
                                    'JSON configuration...'
                                } />
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                  {field.includes('fragment') && 'Настройки фрагментации пакетов'}
                                  {field.includes('noise') && 'Настройки шумовой обфускации'}
                                  {field.includes('fallback') && 'JSON массив fallback конфигураций'}
                                </Text>
                              </Box> :
                              <Input {...formField} />
                          )}
                        />
                      </FormControl>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}

          {/* Ошибки валидации */}
          {validationResult && !validationResult.isValid && (
            <Alert status="error">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">{t('Validation Errors')}</Text>
                {validationResult.errors.map((error, index) => (
                  <Text key={index} fontSize="sm">{error.message}</Text>
                ))}
              </VStack>
            </Alert>
          )}

          {/* Превью JSON */}
          <Box>
            <HStack justify="space-between" mb={3}>
              <Text fontSize="md" fontWeight="medium">
                {t('Configuration Preview')}
              </Text>
              <Button size="sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? t('Hide') : t('Show')} JSON
              </Button>
            </HStack>
            
            {showPreview && previewConfig && (
              <Code
                p={3}
                w="full"
                bg={codeColor}
                borderRadius="md"
                display="block"
                whiteSpace="pre-wrap"
                fontSize="sm"
              >
                {JSON.stringify(previewConfig, null, 2)}
              </Code>
            )}
          </Box>

          <Divider />

          {/* Действия */}
          <HStack justify="end" spacing={3}>
            <Button onClick={onCancel} isDisabled={isLoading}>
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
              isDisabled={!validationResult?.isValid}
            >
              {mode === 'create' ? t('Create') : t('Save')}
            </Button>
          </HStack>
        </VStack>
      </form>
    </VStack>
  );
};