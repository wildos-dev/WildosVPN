import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import { useToast } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type {
  InboundConfig,
  InboundTemplate,
  InboundManagerState,
  InboundFormData,
  ValidationResult
} from "../types/InboundTypes";
import { GenerationUtils } from "../config/inboundConfig";
import { validateInboundForm } from "../schemas/inboundSchemas";
import { useInboundTemplates } from "./useInboundTemplates";

// Хук для управления состоянием инбаундов
export const useInboundManager = (initialInbounds: InboundConfig[] = []) => {
  const { t } = useTranslation();
  const toast = useToast();
  
  const {
    templates,
    categories,
    isLoadingTemplates,
    validateConfig,
    createInbound,
    isValidating,
    isCreating
  } = useInboundTemplates();

  // Основное состояние
  const [state, setState] = useState<InboundManagerState>({
    mode: 'list',
    selectedTemplate: undefined,
    editingInbound: undefined,
    existingInbounds: initialInbounds,
    categories,
    templates
  });

  // Обновление шаблонов и категорий при загрузке
  useEffect(() => {
    setState(prev => ({
      ...prev,
      categories,
      templates
    }));
  }, [categories, templates]);

  // Обновление существующих инбаундов
  useEffect(() => {
    setState(prev => ({
      ...prev,
      existingInbounds: initialInbounds
    }));
  }, [initialInbounds]);

  // Вычисляемые значения
  const existingTags = useMemo(() => 
    state.existingInbounds.map(inbound => inbound.tag),
    [state.existingInbounds]
  );

  const occupiedPorts = useMemo(() => 
    state.existingInbounds.map(inbound => inbound.port),
    [state.existingInbounds]
  );

  const isLoading = isLoadingTemplates || isValidating || isCreating;

  // Переключение режимов
  const switchMode = useCallback((mode: InboundManagerState['mode']) => {
    setState(prev => ({
      ...prev,
      mode,
      selectedTemplate: mode === 'list' ? undefined : prev.selectedTemplate,
      editingInbound: mode === 'list' ? undefined : prev.editingInbound
    }));
  }, []);

  // Выбор шаблона
  const selectTemplate = useCallback((template: InboundTemplate) => {
    setState(prev => ({
      ...prev,
      selectedTemplate: template,
      mode: 'create'
    }));
  }, []);

  // Создание нового инбаунда
  const startCreate = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'create',
      selectedTemplate: undefined,
      editingInbound: undefined
    }));
  }, []);

  // Редактирование инбаунда
  const startEdit = useCallback((inbound: InboundConfig) => {
    setState(prev => ({
      ...prev,
      mode: 'edit',
      editingInbound: inbound,
      selectedTemplate: undefined
    }));
  }, []);

  // Дублирование инбаунда
  const startDuplicate = useCallback((inbound: InboundConfig) => {
    const duplicatedInbound: InboundConfig = {
      ...inbound,
      tag: GenerationUtils.generateUniqueTag(`${inbound.tag}_copy`, existingTags),
      port: GenerationUtils.generateRandomPort(occupiedPorts)
    };

    setState(prev => ({
      ...prev,
      mode: 'duplicate',
      editingInbound: duplicatedInbound,
      selectedTemplate: undefined
    }));
  }, [existingTags, occupiedPorts]);

  // Удаление инбаунда
  const deleteInbound = useCallback((inbound: InboundConfig) => {
    setState(prev => ({
      ...prev,
      existingInbounds: prev.existingInbounds.filter(i => i.tag !== inbound.tag)
    }));

    toast({
      title: t('Inbound deleted'),
      description: t('Inbound {{tag}} has been deleted', { tag: inbound.tag }),
      status: 'info',
      duration: 3000,
      isClosable: true
    });
  }, [t, toast]);

  // Валидация формы
  const validateForm = useCallback(async (formData: InboundFormData): Promise<ValidationResult> => {
    // Клиентская валидация
    const clientValidation = validateInboundForm(formData, existingTags, occupiedPorts);
    
    if (!clientValidation.isValid) {
      return clientValidation;
    }

    // Серверная валидация
    if (state.selectedTemplate) {
      const config = {
        tag: formData.tag,
        port: formData.port,
        protocol: state.selectedTemplate.protocol,
        settings: {
          ...state.selectedTemplate.baseConfig.settings,
          ...formData.editableValues
        },
        streamSettings: state.selectedTemplate.baseConfig.streamSettings,
        ...formData.advancedValues
      };

      return await validateConfig(config, existingTags, occupiedPorts);
    }

    return clientValidation;
  }, [existingTags, occupiedPorts, state.selectedTemplate, validateConfig]);

  // Сохранение инбаунда
  const saveInbound = useCallback(async (formData: InboundFormData): Promise<boolean> => {
    if (!state.selectedTemplate) {
      toast({
        title: t('Error'),
        description: t('No template selected'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return false;
    }

    // Валидация перед сохранением
    const validation = await validateForm(formData);
    if (!validation.isValid) {
      return false;
    }

    // Создание конфигурации
    const config = {
      ...formData.editableValues,
      ...formData.advancedValues
    };

    const success = await createInbound(
      formData.tag,
      formData.port,
      state.selectedTemplate.protocol,
      config,
      state.selectedTemplate.id
    );

    if (success) {
      // Добавление в локальное состояние
      const newInbound: InboundConfig = {
        tag: formData.tag,
        port: formData.port,
        protocol: state.selectedTemplate.protocol as any,
        settings: {
          ...state.selectedTemplate.baseConfig.settings,
          ...formData.editableValues
        },
        streamSettings: state.selectedTemplate.baseConfig.streamSettings
      };

      setState(prev => ({
        ...prev,
        existingInbounds: [...prev.existingInbounds, newInbound],
        mode: 'list',
        selectedTemplate: undefined,
        editingInbound: undefined
      }));
    }

    return success;
  }, [state.selectedTemplate, validateForm, createInbound, t, toast]);

  // Обновление инбаунда
  const updateInbound = useCallback(async (formData: InboundFormData): Promise<boolean> => {
    if (!state.editingInbound) {
      return false;
    }

    // Для простоты пока просто обновляем локально
    // В реальной реализации нужен отдельный API endpoint для обновления
    
    const updatedInbound: InboundConfig = {
      ...state.editingInbound,
      tag: formData.tag,
      port: formData.port,
      settings: {
        ...state.editingInbound.settings,
        ...formData.editableValues
      }
    };

    setState(prev => ({
      ...prev,
      existingInbounds: prev.existingInbounds.map(inbound =>
        inbound.tag === state.editingInbound!.tag ? updatedInbound : inbound
      ),
      mode: 'list',
      editingInbound: undefined
    }));

    toast({
      title: t('Success'),
      description: t('Inbound updated successfully'),
      status: 'success',
      duration: 3000,
      isClosable: true
    });

    return true;
  }, [state.editingInbound, t, toast]);

  // Отмена операции
  const cancel = useCallback(() => {
    switchMode('list');
  }, [switchMode]);

  // Автозаполнение формы при выборе шаблона
  const getFormDefaults = useCallback((template?: InboundTemplate): Partial<InboundFormData> => {
    if (!template) return {};

    const defaults: Partial<InboundFormData> = {
      templateId: template.id,
      tag: GenerationUtils.generateUniqueTag(
        template.name.toLowerCase().replace(/\s+/g, '_'),
        existingTags
      ),
      port: template.defaultPort || GenerationUtils.generateRandomPort(occupiedPorts),
      editableValues: {},
      advancedValues: {}
    };

    // Автогенерация значений
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

    defaults.editableValues = autoValues;

    return defaults;
  }, [existingTags, occupiedPorts]);

  return {
    // Состояние
    state,
    isLoading,
    
    // Вычисляемые значения
    existingTags,
    occupiedPorts,
    
    // Функции управления режимами
    switchMode,
    startCreate,
    startEdit,
    startDuplicate,
    cancel,
    
    // Функции работы с шаблонами
    selectTemplate,
    getFormDefaults,
    
    // Функции CRUD операций
    validateForm,
    saveInbound,
    updateInbound,
    deleteInbound,
    
    // Состояния операций
    isValidating,
    isCreating
  };
};