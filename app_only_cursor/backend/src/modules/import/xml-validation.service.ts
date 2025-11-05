import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { parseString } from 'xml2js';

@Injectable()
export class XmlValidationService {
  private xsdSchema: string;

  constructor() {
    const xsdPath = path.join(__dirname, '../../../assets/schema.xsd');
    try {
      this.xsdSchema = fs.readFileSync(xsdPath, 'utf-8');
    } catch (error) {
      console.warn('Schema XSD não encontrado, validação estrutural será usada');
      this.xsdSchema = '';
    }
  }

  async validateXml(xmlContent: string | Buffer): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const xmlString = typeof xmlContent === 'string' ? xmlContent : xmlContent.toString('utf-8');
      
      // Parse XML para validar estrutura básica
      return new Promise((resolve) => {
        parseString(xmlString, (err, result) => {
          if (err) {
            resolve({
              valid: false,
              errors: [`Erro ao parsear XML: ${err.message}`],
            });
            return;
          }

          const errors: string[] = [];

          // Validação estrutural básica
          if (!result.Importacao) {
            errors.push('Elemento raiz "Importacao" não encontrado');
          } else {
            // Validar Cursos
            if (!result.Importacao.Cursos || !result.Importacao.Cursos[0]?.Curso) {
              errors.push('Seção "Cursos" não encontrada ou vazia');
            } else {
              result.Importacao.Cursos[0].Curso.forEach((curso: any, index: number) => {
                if (!curso.Codigo || !curso.Codigo[0]) {
                  errors.push(`Curso ${index + 1}: Codigo obrigatório`);
                }
                if (!curso.Nome || !curso.Nome[0]) {
                  errors.push(`Curso ${index + 1}: Nome obrigatório`);
                }
                if (!curso.CargaHoraria || !curso.CargaHoraria[0]) {
                  errors.push(`Curso ${index + 1}: CargaHoraria obrigatória`);
                }
              });
            }

            // Validar Turmas
            if (!result.Importacao.Turmas || !result.Importacao.Turmas[0]?.Turma) {
              errors.push('Seção "Turmas" não encontrada ou vazia');
            } else {
              result.Importacao.Turmas[0].Turma.forEach((turma: any, index: number) => {
                if (!turma.Id || !turma.Id[0]) {
                  errors.push(`Turma ${index + 1}: Id obrigatório`);
                }
                if (!turma.CursoCodigo || !turma.CursoCodigo[0]) {
                  errors.push(`Turma ${index + 1}: CursoCodigo obrigatório`);
                }
                if (!turma.Semestre || !turma.Semestre[0]) {
                  errors.push(`Turma ${index + 1}: Semestre obrigatório`);
                }
              });
            }

            // Validar Alunos
            if (!result.Importacao.Alunos || !result.Importacao.Alunos[0]?.Aluno) {
              errors.push('Seção "Alunos" não encontrada ou vazia');
            } else {
              result.Importacao.Alunos[0].Aluno.forEach((aluno: any, index: number) => {
                if (!aluno.RA || !aluno.RA[0]) {
                  errors.push(`Aluno ${index + 1}: RA obrigatório`);
                }
                if (!aluno.Nome || !aluno.Nome[0]) {
                  errors.push(`Aluno ${index + 1}: Nome obrigatório`);
                }
              });
            }

            // Validar Notas
            if (!result.Importacao.Notas || !result.Importacao.Notas[0]?.Nota) {
              errors.push('Seção "Notas" não encontrada ou vazia');
            } else {
              result.Importacao.Notas[0].Nota.forEach((nota: any, index: number) => {
                if (!nota.RA || !nota.RA[0]) {
                  errors.push(`Nota ${index + 1}: RA obrigatório`);
                }
                if (!nota.TurmaId || !nota.TurmaId[0]) {
                  errors.push(`Nota ${index + 1}: TurmaId obrigatório`);
                }
                if (!nota.Valor || !nota.Valor[0]) {
                  errors.push(`Nota ${index + 1}: Valor obrigatório`);
                } else {
                  const valor = parseFloat(nota.Valor[0]);
                  if (isNaN(valor) || valor < 0 || valor > 10) {
                    errors.push(`Nota ${index + 1}: Valor deve estar entre 0 e 10`);
                  }
                }
              });
            }
          }

          resolve({
            valid: errors.length === 0,
            errors,
          });
        });
      });
    } catch (error: any) {
      return {
        valid: false,
        errors: [`Erro na validação: ${error.message}`],
      };
    }
  }
}

