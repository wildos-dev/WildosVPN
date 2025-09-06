import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useToast } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type {
  InboundTemplate,
  TemplateCategory,
  InboundConfig,
  ValidationResult
} from "../types/InboundTypes";

// Типы для API ответов
interface TemplatesResponse {
  templates: InboundTemplate[];
  categories: TemplateCategory[];
}

interface ValidationRequest {
  config: Record<string, any>;
  existing_tags?: string[];
  occupied_ports?: number[];
}

interface ValidationResponse {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

interface CreateInboundRequest {
  tag: string;
  port: number;
  protocol: string;
  template_id?: string;
  config: Record<string, any>;
}

interface CreateInboundResponse {
  success: boolean;
  message: string;
  inbound?: Record<string, any>;
}

// API функции
const api = {
  async getTemplates(): Promise<TemplatesResponse> {
    const response = await fetch('/api/core/templates', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async validateConfig(request: ValidationRequest): Promise<ValidationResponse> {
    const response = await fetch('/api/core/config/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async createInbound(request: CreateInboundRequest): Promise<CreateInboundResponse> {
    const response = await fetch('/api/core/inbounds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

// Хук для работы с шаблонами
export const useInboundTemplates = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Запрос шаблонов
  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    error: templatesError,
    refetch: refetchTemplates
  } = useQuery<TemplatesResponse>(
    ['inbound-templates'],
    api.getTemplates,
    {
      staleTime: 5 * 60 * 1000, // 5 минут
      retry: 2,
      onError: (error) => {
        toast({
          title: t('Error loading templates'),
          description: error instanceof Error ? error.message : t('Unknown error'),
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    }
  );

  // Мутация валидации
  const validateConfigMutation = useMutation<ValidationResponse, Error, ValidationRequest>(
    api.validateConfig,
    {
      onError: (error) => {
        toast({
          title: t('Validation error'),
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }
  );

  // Мутация создания инбаунда
  const createInboundMutation = useMutation<CreateInboundResponse, Error, CreateInboundRequest>(
    api.createInbound,
    {
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: t('Success'),
            description: data.message,
            status: 'success',
            duration: 3000,
            isClosable: true
          });
          
          // Обновление кэша
          queryClient.invalidateQueries(['core-config']);
        } else {
          toast({
            title: t('Error'),
            description: data.message,
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        }
      },
      onError: (error) => {
        toast({
          title: t('Error creating inbound'),
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    }
  );

  // Функции для удобства использования
  const validateConfig = useCallback(async (
    config: Record<string, any>,
    existingTags?: string[],
    occupiedPorts?: number[]
  ): Promise<ValidationResult> => {
    try {
      const response = await validateConfigMutation.mutateAsync({
        config,
        existing_tags: existingTags,
        occupied_ports: occupiedPorts
      });

      return {
        isValid: response.is_valid,
        errors: response.errors.map(error => ({ field: '', message: error, code: 'VALIDATION' })),
        warnings: response.warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{ 
          field: '', 
          message: error instanceof Error ? error.message : t('Validation failed'), 
          code: 'ERROR' 
        }]
      };
    }
  }, [validateConfigMutation, t]);

  const createInbound = useCallback(async (
    tag: string,
    port: number,
    protocol: string,
    config: Record<string, any>,
    templateId?: string
  ): Promise<boolean> => {
    try {
      const response = await createInboundMutation.mutateAsync({
        tag,
        port,
        protocol,
        config,
        template_id: templateId
      });

      return response.success;
    } catch (error) {
      return false;
    }
  }, [createInboundMutation]);

  // Обработка категорий с правильным подсчетом шаблонов
  const processedCategories = useMemo(() => {
    if (!templatesData?.categories || !templatesData?.templates) {
      return [];
    }

    return templatesData.categories.map(category => {
      const categoryTemplates = templatesData.templates.filter(template => 
        template.category === category.id || 
        category.protocols?.includes(template.protocol)
      );
      
      return {
        ...category,
        count: categoryTemplates.length
      };
    });
  }, [templatesData]);

  return {
    // Данные
    templates: templatesData?.templates || [],
    categories: processedCategories,
    
    // Состояния загрузки
    isLoadingTemplates,
    isValidating: validateConfigMutation.isLoading,
    isCreating: createInboundMutation.isLoading,
    
    // Ошибки
    templatesError,
    validationError: validateConfigMutation.error,
    createError: createInboundMutation.error,
    
    // Функции
    validateConfig,
    createInbound,
    refetchTemplates,
    
    // Результаты последних операций
    lastValidation: validateConfigMutation.data,
    lastCreation: createInboundMutation.data
  };
};