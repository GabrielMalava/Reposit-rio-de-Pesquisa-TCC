import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsCalculationService {
  constructor(private prisma: PrismaService) {}

  async calculateAndStoreMetrics() {
    // Métricas são calculadas sob demanda para manter dados sempre atualizados
    // Esta função pode ser usada para pré-calcular e armazenar métricas se necessário
  }

  async calculateStudentMetrics(studentId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            course: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return {
        gpa: 0,
        overallStatus: 'N/A',
        disciplines: [],
      };
    }

    // Calcular GPA ponderado
    let totalWeightedGrade = 0;
    let totalWorkload = 0;
    const disciplines = [];

    for (const enrollment of enrollments) {
      const grade = Number(enrollment.grade);
      const workload = enrollment.class.course.workload;
      const status = grade >= 6 ? 'Aprovado' : 'Reprovado';

      totalWeightedGrade += grade * workload;
      totalWorkload += workload;

      disciplines.push({
        courseCode: enrollment.class.course.code,
        courseName: enrollment.class.course.name,
        grade,
        status,
        semester: enrollment.class.semester,
        workload,
      });
    }

    const gpa = totalWorkload > 0 ? totalWeightedGrade / totalWorkload : 0;

    // Situação geral: aprovado se GPA >= 6 e todas disciplinas aprovadas
    const hasFailedDiscipline = disciplines.some((d) => d.status === 'Reprovado');
    const overallStatus = gpa >= 6 && !hasFailedDiscipline ? 'Aprovado' : 'Reprovado';

    return {
      gpa: Number(gpa.toFixed(2)),
      overallStatus,
      disciplines,
    };
  }

  async calculateClassMetrics(classId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: true,
        class: {
          include: {
            course: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return {
        average: 0,
        standardDeviation: 0,
        approvalRate: 0,
        totalStudents: 0,
      };
    }

    const grades = enrollments.map((e) => Number(e.grade));
    const average = grades.reduce((a, b) => a + b, 0) / grades.length;

    // Desvio padrão
    const variance =
      grades.reduce((sum, grade) => sum + Math.pow(grade - average, 2), 0) /
      grades.length;
    const standardDeviation = Math.sqrt(variance);

    // Taxa de aprovação
    const approvedCount = grades.filter((g) => g >= 6).length;
    const approvalRate = (approvedCount / grades.length) * 100;

    return {
      average: Number(average.toFixed(2)),
      standardDeviation: Number(standardDeviation.toFixed(2)),
      approvalRate: Number(approvalRate.toFixed(2)),
      totalStudents: enrollments.length,
    };
  }

  async calculateCourseMetrics(courseCode: string) {
    const course = await this.prisma.course.findUnique({
      where: { code: courseCode },
      include: {
        classes: {
          include: {
            enrollments: true,
          },
        },
      },
    });

    if (!course || course.classes.length === 0) {
      return {
        average: 0,
        standardDeviation: 0,
        approvalRate: 0,
        totalStudents: 0,
      };
    }

    // Coletar todas as notas de todas as turmas
    const allGrades: number[] = [];
    for (const classItem of course.classes) {
      for (const enrollment of classItem.enrollments) {
        allGrades.push(Number(enrollment.grade));
      }
    }

    if (allGrades.length === 0) {
      return {
        average: 0,
        standardDeviation: 0,
        approvalRate: 0,
        totalStudents: 0,
      };
    }

    const average = allGrades.reduce((a, b) => a + b, 0) / allGrades.length;
    const variance =
      allGrades.reduce((sum, grade) => sum + Math.pow(grade - average, 2), 0) /
      allGrades.length;
    const standardDeviation = Math.sqrt(variance);
    const approvedCount = allGrades.filter((g) => g >= 6).length;
    const approvalRate = (approvedCount / allGrades.length) * 100;

    return {
      average: Number(average.toFixed(2)),
      standardDeviation: Number(standardDeviation.toFixed(2)),
      approvalRate: Number(approvalRate.toFixed(2)),
      totalStudents: allGrades.length,
    };
  }

  async calculateOverallMetrics() {
    const students = await this.prisma.student.findMany();
    const allEnrollments = await this.prisma.enrollment.findMany({
      include: {
        class: {
          include: {
            course: true,
          },
        },
      },
    });

    const totalStudents = students.length;
    const allGrades = allEnrollments.map((e) => Number(e.grade));

    if (allGrades.length === 0) {
      return {
        totalStudents: 0,
        overallGPA: 0,
        overallApprovalRate: 0,
      };
    }

    // Calcular médias gerais de todos os alunos
    const studentGPAs: number[] = [];
    for (const student of students) {
      const metrics = await this.calculateStudentMetrics(student.id);
      if (metrics.gpa > 0) {
        studentGPAs.push(metrics.gpa);
      }
    }

    const overallGPA =
      studentGPAs.length > 0
        ? studentGPAs.reduce((a, b) => a + b, 0) / studentGPAs.length
        : 0;

    const approvedCount = allGrades.filter((g) => g >= 6).length;
    const overallApprovalRate = (approvedCount / allGrades.length) * 100;

    return {
      totalStudents,
      overallGPA: Number(overallGPA.toFixed(2)),
      overallApprovalRate: Number(overallApprovalRate.toFixed(2)),
    };
  }
}


