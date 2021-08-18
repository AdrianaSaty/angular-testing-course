import { HttpErrorResponse } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { flush, TestBed } from "@angular/core/testing";
import { COURSES, findLessonsForCourse } from "../../../../server/db-data";
import { Course } from "../model/course";
import { CoursesService } from "./courses.service"

describe("CoursesService", () => {

    let coursesService: CoursesService,
        httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [CoursesService]
        });
        coursesService = TestBed.inject<CoursesService>(CoursesService);
        httpTestingController = TestBed.inject<HttpTestingController>(HttpTestingController);
    })

    it('should retrieve all courses', () => {
        coursesService.findAllCourses()
            .subscribe(courses => {
                const course = courses.find(course => course.id == 12);
                expect(course.titles.description).toBe("Angular Testing Course");
                expect(courses).toBeTruthy('No courses returned');
                expect(courses.length).toBe(12, 'incorrect number of courses');
            });
        const req = httpTestingController.expectOne('/api/courses');
        expect(req.request.method).toEqual("GET");
        req.flush({ payload: Object.values(COURSES) });
    });

    it('should find course by id', () => {
        const courseId = 2;
        coursesService.findCourseById(courseId)
            .subscribe(course => {
                expect(course).toBeTruthy('No courses returned');
                expect(course.titles.description).toBe("Angular Core Deep Dive");
            });
        const req = httpTestingController.expectOne(`/api/courses/${courseId}`);
        expect(req.request.method).toEqual("GET");
        req.flush(COURSES[courseId]);

    });

    it('should save course', () => {
        const courseId = 3;
        const changes: Partial<Course> = { category: "MODIFIED" }
        coursesService.saveCourse(courseId, changes)
            .subscribe(course => {
                expect(course.id).toBe(3);
            });
        const req = httpTestingController.expectOne(`/api/courses/${courseId}`);
        expect(req.request.method).toEqual("PUT");
        expect(req.request.body.category).toEqual(changes.category)
        req.flush({
            ...COURSES[courseId],
            ...changes
        });
    });

    it('should give an error if save course fails', () => {
        const courseId = 4;
        const changes: Partial<Course> = { category: "MODIFIED" }
        coursesService.saveCourse(courseId, changes)
            .subscribe(
                () => fail("the save course operation should have failed"),
                (error: HttpErrorResponse) => {
                    expect(error.status).toBe(500);
                }
            );
        const req = httpTestingController.expectOne(`/api/courses/${courseId}`);
        expect(req.request.method).toEqual("PUT");
        req.flush('Save course fail', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should find a list of lessons', () => {
        const courseId = 12;
        coursesService.findLessons(courseId)
            .subscribe(lessons => {
                expect(lessons).toBeTruthy();
                expect(lessons.length).toBe(3);
            }
            );
        const req = httpTestingController.expectOne(
            req => req.url == '/api/lessons');
        expect(req.request.method).toEqual("GET");
        expect(req.request.params.get("courseId")).toEqual("12");
        expect(req.request.params.get("filter")).toEqual("");
        expect(req.request.params.get("sortOrder")).toEqual("asc");
        expect(req.request.params.get("pageNumber")).toEqual("0");
        expect(req.request.params.get("pageSize")).toEqual("3");
        req.flush({
            payload: findLessonsForCourse(courseId).slice(0, 3)
        })
    });

    afterEach(() => {
        httpTestingController.verify();
    })
})