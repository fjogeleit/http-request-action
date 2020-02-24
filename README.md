# HTTP Request Action

Create any kind of HTTP Requests in your GitHub actions to trigger Tools like Ansible AWX

Exmaple Usage:
```
jobs:
    deployment
        - name: Deploy Stage
            uses: fjogeleit/http-request-action@master
            with:
                url: 'https://ansible.io/api/v2/job_templates/84/launch/'
                method: 'POST'
                username: ${{ secrets.AWX_USER }}
                password: ${{ secrets.AWX_PASSWORD }}
```

### Input Arguments

|Argument|  Description  |  Default  |
|--------|---------------|-----------|
|url     | Request URL   | _required_ Field |
|method  | Request Method| POST |
|contentType  | Request ContentType| application/json |
|data    | Request Body Content as JSON String, only for POST / PUT / PATCH Requests | '{}' |
|timeout| Request Timeout in ms | 5000 (5s) |
|username| Username for Basic Auth ||
|password| Password for Basic Auth ||
|bearerToken| Bearer Authentication Token (without Bearer Prefix) ||

### Output

- `response` Request Response as JSON String
